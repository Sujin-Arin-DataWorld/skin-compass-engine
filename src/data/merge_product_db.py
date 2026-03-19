#!/usr/bin/env python3
"""
SkinStrategyLab Product DB Merge Script
기존 product_db.json + product_db_additions.json → product_db_merged.json
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCRIPT_DIR: Path = Path(__file__).resolve().parent

db_path: Path = SCRIPT_DIR / "product_db.json"
additions_path: Path = SCRIPT_DIR / "product_db_additions.json"
output_path: Path = SCRIPT_DIR / "product_db_merged.json"

if not db_path.exists():
    print(f"ERROR: {db_path.name} 파일을 찾을 수 없습니다. 파이썬 스크립트와 같은 폴더에 넣어주세요.")
    sys.exit(1)

if not additions_path.exists():
    print(f"ERROR: {additions_path.name} 파일을 찾을 수 없습니다. 파이썬 스크립트와 같은 폴더에 넣어주세요.")
    sys.exit(1)

print("🚀 [SkinStrategyLab] 스마트 병합 엔진 가동...")

db: dict[str, Any] = json.loads(db_path.read_text(encoding="utf-8"))
additions: dict[str, Any] = json.loads(additions_path.read_text(encoding="utf-8"))

products: list[dict[str, Any]] = db.get("products", [])
print(f"📦 로드된 기존 DB 제품: {len(products)}개")

# Step 1: Remove non-target products
instructions: dict[str, Any] = additions.get("_merge_instructions", {})
remove_ids: set[str] = set(instructions.get("remove_from_existing", []))
if remove_ids:
    before_count: int = len(products)
    products = [p for p in products if p.get("id") not in remove_ids]
    removed_count: int = before_count - len(products)
    print(f"🗑️ 불필요한 기존 제품 삭제됨: {removed_count}개")

# Step 2: Reclassify FR/HU products (e.g. Geek&Gorgeous -> DE)
reclassify_map: dict[str, dict[str, Any]] = instructions.get("reclassify_in_existing", {})
for pid, changes in reclassify_map.items():
    for p in products:
        if p.get("id") == pid:
            p.update(changes)
            print(f"♻️ 제품 데이터 재분류 업데이트됨: {pid}")

# Step 3: Add new products (Update if already exists)
# Type checker safe dictionary comprehension: cast id to str explicitly
existing_idx_map: dict[str, int] = {str(p["id"]): i for i, p in enumerate(products) if p.get("id")}
new_products: list[dict[str, Any]] = additions.get("products", [])

# Explicit typing for counters to prevent Pyre scoping issues
added_count: int = 0
updated_count: int = 0

for p in new_products:
    pid: Any = p.get("id")
    if not pid:
        continue
        
    pid_str: str = str(pid)
    if pid_str in existing_idx_map:
        # 중복 ID가 존재하면 최신 데이터로 덮어쓰기 (Update)
        idx: int = existing_idx_map[pid_str]
        products[idx].update(p)  # type: ignore[union-attr]
        # Avoid += for Pyre false positives, use explicit assignment with ignore
        updated_count = updated_count + 1  # type: ignore[operator]
    else:
        # 완전히 새로운 제품 추가 (Add)
        products.append(p)  # type: ignore[union-attr]
        existing_idx_map[pid_str] = len(products) - 1
        added_count = added_count + 1  # type: ignore[operator]

print(f"✨ 결과: 신규 추가 {added_count}개 / 기존 데이터 덮어쓰기 {updated_count}개")

# Step 4: Update metadata
db["products"] = products
db["_schema_version"] = "4.0"
db["_engine_last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Step 5: Save
output_path.write_text(json.dumps(db, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"\n🎉 병합 대성공! 최종 통합 DB 제품 수: {len(products)}개")
print(f"💾 생성된 파일명: {output_path.name}")