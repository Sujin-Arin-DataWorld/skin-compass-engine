import json
import os
import time
import requests  # type: ignore[import-untyped]
import re
import urllib.parse
from typing import Any

# ==========================================
# ⚙️ 1. 환경 설정 (Configuration)
# ==========================================
DB_FILE_PATH = os.path.join("src", "data", "product_db_merged.json")
KFDA_API_KEY = os.environ.get("KFDA_API_KEY", "YOUR_DATA_GO_KR_API_KEY_HERE")

# ==========================================
# 🛑 2. 2026 EU CPNP 규제 룰셋
# ==========================================
PFAS_KEYWORDS = ["fluoro", "perfluoro", "polyfluoro", "ptfe", "teflon", "polytef"]
ALLERGENS_2026 = [
    "linalool", "limonene", "geraniol", "citronellol", "hexyl cinnamal",
    "benzyl salicylate", "citral", "eugenol", "coumarin", "farnesol",
    "benzyl alcohol", "benzyl benzoate", "cinnamal", "isoeugenol",
    "menthol", "camphor", "terpineol", "pinene", "eucalyptol", "terpinolene"
]

# ==========================================
# 🌐 3. API 통신 및 분석 모듈 (🔥 검색 로직 대폭 업그레이드)
# ==========================================
def fetch_obf_full_inci(brand, name_en, barcode=None):
    """Step 1: OBF API 스마트 다중 검색 및 독일어 전성분 추출"""
    
    # 0순위: 바코드가 있으면 묻지도 따지지도 않고 바로 100% 매칭
    if barcode:
        url = f"https://world.openbeautyfacts.org/api/v2/product/{barcode}.json"
        try:
            res = requests.get(url, timeout=10).json()
            if res.get("status") == 1:
                p = res.get("product", {})
                # 영어, 독일어, 기본 전성분 순서대로 있는 것을 가져옴
                return p.get("ingredients_text_en") or p.get("ingredients_text_de") or p.get("ingredients_text")
        except:
            pass

    # 텍스트 검색 쿼리 리스트 (집요하게 3번 찔러보기)
    queries = []
    
    # 1. 브랜드 + 전체 영어 이름
    queries.append(f"{brand} {name_en}")
    
    # 2. 너무 긴 이름 때문에 튕기는 걸 막기 위해: 브랜드 + 이름 앞 2단어만 짧게! (예: "Balea Beauty Expert")
    words = name_en.split()
    if len(words) >= 2:
        queries.append(f"{brand} {words[0]} {words[1]}")
    elif len(words) == 1:
        queries.append(f"{brand} {words[0]}")

    for q in queries:
        query = urllib.parse.quote(q)
        search_url = f"https://world.openbeautyfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1"
        
        try:
            res = requests.get(search_url, timeout=10).json()
            if res.get("count", 0) > 0:
                # 상위 3개 제품을 까서 전성분이 비어있지 않은 첫 번째 놈을 잡음
                for item in res.get("products", [])[:3]:
                    inci = item.get("ingredients_text_en") or item.get("ingredients_text_de") or item.get("ingredients_text")
                    if inci:
                        return inci
        except Exception:
            continue
            
    return None

def fetch_kfda_safety_info(inci_name):
    if KFDA_API_KEY == "YOUR_DATA_GO_KR_API_KEY_HERE": return None
    url = "http://apis.data.go.kr/1471000/CosmeticIngrInfoService01/getCosmeticIngrInfo01"
    params = {"ServiceKey": KFDA_API_KEY, "pageNo": "1", "numOfRows": "1", "ingr_eng_name": inci_name, "type": "json"}
    try:
        res = requests.get(url, params=params, timeout=5).json()
        if res.get("header", {}).get("resultCode") == "00":
            items = res.get("body", {}).get("items", [])
            if items: return {"cas_no": items[0].get("cas_no"), "mfds_limit": items[0].get("limit_cond")}
    except: pass
    return None

def analyze_2026_cpnp(full_inci_text):
    analysis: dict[str, Any] = {
        "is_cpnp_2026_safe": True, "pfas_detected": [], "allergens_to_declare_2026": [],
        "note": "2026년 7월 의무화되는 신규 INCI 용어집 변경 여부 확인 필요."
    }
    if not full_inci_text or full_inci_text == "MANUAL_CHECK_REQUIRED":
        analysis["is_cpnp_2026_safe"] = "Unknown"
        return analysis
        
    text_lower = full_inci_text.lower()
    for pfas in PFAS_KEYWORDS:
        if pfas in text_lower:
            analysis["pfas_detected"].append(pfas)
            analysis["is_cpnp_2026_safe"] = False 
    for allergen in ALLERGENS_2026:
        if re.search(r'\b' + allergen + r'\b', text_lower):
            analysis["allergens_to_declare_2026"].append(allergen)
    return analysis

# ==========================================
# 🚀 4. 메인 엔진 파이프라인
# ==========================================
def run_pipeline():
    print("🚀 [SkinStrategyLab] 스마트 다중검색 파이프라인 가동...")
    print(f"📂 대상 파일: {DB_FILE_PATH}")
    print("-" * 65)
    
    if not os.path.exists(DB_FILE_PATH):
        print(f"❌ '{DB_FILE_PATH}' 파일을 찾을 수 없습니다.")
        return

    with open(DB_FILE_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)

    products = db.get("products", [])
    total = len(products)
    success_count: int = 0

    for idx, product in enumerate(products):
        brand = product.get("brand", "")
        name = product.get("name_en", "")
        barcode = product.get("barcode", "")
        
        # 터미널 창에 바코드 유무도 함께 표시되도록 UI 개선
        barcode_tag = f"[바코드: {barcode}]" if barcode else "[바코드: ❌]"
        print(f"[{idx+1}/{total}] 🔄 분석 중: {brand} - {name} {barcode_tag}")
        
        current_inci = product.get("full_inci_list")
        
        if not current_inci or current_inci == "MANUAL_CHECK_REQUIRED":
            full_inci = fetch_obf_full_inci(brand, name, barcode)
            
            if full_inci:
                product["full_inci_list"] = full_inci
                print("  ✅ [OBF] 전성분 매칭 성공!")
                success_count += 1 # type: ignore[operator]
            else:
                product["full_inci_list"] = "MANUAL_CHECK_REQUIRED"
                print("  ⚠️ [OBF] 검색 실패 (json 파일에 barcode 속성을 추가해 보세요)")
        else:
            print("  ✅ [기존 데이터 보존] 수동/자동 입력된 성분 데이터 유지")
            success_count += 1 # type: ignore[operator]
            
        cpnp_report = analyze_2026_cpnp(product.get("full_inci_list"))
        product["cpnp_2026_compliance"] = cpnp_report
        
        if cpnp_report.get("pfas_detected"):
            print(f"  🚨 [수출 불가] PFAS 검출: {cpnp_report['pfas_detected']}")
        if cpnp_report.get("allergens_to_declare_2026"):
            print(f"  📢 [라벨 주의] 표기 의무 알레르겐 {len(cpnp_report['allergens_to_declare_2026'])}종 검출")

        for ing in product.get("ingredients", []):
            inci_name = ing.get("name_inci")
            if inci_name:
                kfda_data = fetch_kfda_safety_info(inci_name)
                if kfda_data:
                    ing["cas_no"] = kfda_data["cas_no"]
                    ing["mfds_limit_info"] = kfda_data["mfds_limit"]
                    
        time.sleep(1.0) # 서버 차단 방지 휴식 (단축)

    db["_engine_last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    with open(DB_FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
        
    print("-" * 65)
    print(f"🎉 엔진 구동 완료! 총 {success_count}/{total}개 제품의 데이터가 갱신되었습니다.")

if __name__ == "__main__":
    run_pipeline()