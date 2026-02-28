"""
============================================================
 Skin Diagnosis Score Engine v3
 ─ 임상학적 증상 교정 완료 버전
 ─ 고위험 증상 조합 패턴 감지 통합
 ─ 제품 추천 + Shopify handle 매핑 포함
============================================================
변경 내역 (v2 → v3):
 [수정] C1_02 턱선만 → 부위별 반복 패턴
 [수정] C1_09/10 블랙헤드·화이트헤드 → 염증 전단계 표현
 [수정] C1_11 자국 → PIE(붉은 자국)로 Cat1 고유화
 [수정] C1_15 자외선 트러블 → 자외선 후 민감+트러블 복합
 [통합] C2_02+03 T존·코 → 분리 유지하되 가중치 조정
 [통합] C2_07+08 → 하나로 병합
 [수정] C2_12 다크닝 → 시간 경과 색상 어두워짐
 [제거] C3_11 물 섭취 → Context로 이동
 [수정] C3_14 얇아짐 → 실핏줄 비침으로 Cat3 고유화
 [수정] C4_05/06 제품명 → 활성 성분/레티놀류 표현
 [수정] C4_15 모세혈관 → 뺨·코 실핏줄 구체화
 [제거] C5_03 여드름 자국 → Cat1에만 유지
 [수정] C5_09 색소형 다크서클 → 갈색빛 다크서클
 [수정] C6_04/05 블랙헤드·화이트헤드 → 모공 관점 재정의
 [수정] C6_12 탄력 없이 늘어짐 → 세로 길쭉 형태
 [수정] C7_10 얇아짐 → 탄력 동시 저하 연결
 [수정] C7_15 제품 니즈 → 얼굴 윤곽 처짐 증상화
 [수정] C8_12 과한 관리 → 물리적 자극 이력 객관화
 [수정] C8_13 여러 제품 → 4단계 이상 발라야 촉촉 증상화
 [추가] 각 카테고리 결원 항목 보충
 [신규] 고위험 증상 조합 패턴 감지 모듈
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
import json
import warnings
warnings.filterwarnings('ignore')


# ============================================================
# SECTION 1: AXIS DEFINITIONS (동일 유지)
# ============================================================

AXES = {
    "seb":              "피지 과분비 (Sebum Overproduction)",
    "hyd":              "수분 부족 (Hydration Deficit)",
    "bar":              "장벽 기능 저하 (Barrier Dysfunction)",
    "sen":              "피부 민감도 (Skin Sensitivity)",
    "ox":               "산화·환경 스트레스 (Oxidative Stress)",
    "acne":             "염증성 여드름 (Inflammatory Acne)",
    "pigment":          "색소 이상 (Pigmentation Disorder)",
    "texture":          "모공·피부결 이상 (Texture / Pore Issue)",
    "aging":            "노화·탄력 저하 (Aging / Elasticity Loss)",
    "makeup_stability": "메이크업 불안정 (Makeup Instability)",
}

AXIS_KEYS = list(AXES.keys())


# ============================================================
# SECTION 2: CLINICALLY CORRECTED SYMPTOM WEIGHT MATRIX v3
# ============================================================

SYMPTOM_WEIGHTS: Dict[str, Dict] = {

    # ── Category 1: 트러블 & 여드름 (개선 완료) ──────────────────
    "C1_01": {
        "text": "반복적으로 여드름이 난다",
        "weights": {"acne": 0.9, "seb": 0.5}
    },
    "C1_02": {
        "text": "특정 부위(턱선·볼·이마)에 반복적으로 집중된다",
        # 개선: 턱선 한정 → 호르몬성 패턴 포괄
        "weights": {"acne": 0.6, "sen": 0.4}
    },
    "C1_03": {
        "text": "생리 전·호르몬 변화 시 트러블이 심해진다",
        "weights": {"acne": 0.5, "sen": 0.4, "seb": 0.3}
    },
    "C1_04": {
        "text": "마스크·헬멧·안경 착용 부위에 트러블이 난다",
        # 개선: Acne mechanica 포함
        "weights": {"acne": 0.6, "bar": 0.4, "sen": 0.3}
    },
    "C1_05": {
        "text": "운동 후 땀·열 때문에 트러블이 올라온다",
        "weights": {"acne": 0.5, "seb": 0.5}
    },
    "C1_06": {
        "text": "새로운 화장품 사용 후 특정 부위에 트러블이 난다",
        "weights": {"sen": 0.7, "acne": 0.4, "bar": 0.3}
    },
    "C1_07": {
        "text": "피부 속에서 딱딱하게 만져지는 염증이 있다",
        # Nodular acne
        "weights": {"acne": 0.9, "sen": 0.2}
    },
    "C1_08": {
        "text": "고름이 차는 염증성 여드름이 자주 생긴다",
        # Pustular acne IGA Grade 3~4
        "weights": {"acne": 1.0, "sen": 0.3}
    },
    "C1_09": {
        "text": "여드름이 아직 나지 않은 부위에 작은 돌기들이 잡힌다",
        # 개선: 화이트헤드(염증 전단계) → Cat1 고유화
        "weights": {"acne": 0.5, "seb": 0.4, "texture": 0.3}
    },
    "C1_10": {
        "text": "여드름 자리에 붉은 자국(PIE)이 수개월 남는다",
        # 개선: PIE(Post-Inflammatory Erythema) → Cat1 고유, PIH는 Cat5
        "weights": {"acne": 0.4, "sen": 0.3, "bar": 0.2}
    },
    "C1_11": {
        "text": "피지를 짜도 금방 다시 찬다",
        "weights": {"seb": 0.9, "acne": 0.2}
    },
    "C1_12": {
        "text": "피지 분비량이 갑자기 늘어난 느낌이다",
        "weights": {"seb": 0.8, "acne": 0.3}
    },
    "C1_13": {
        "text": "스트레스를 받으면 바로 피부에 올라온다",
        "weights": {"acne": 0.5, "sen": 0.5}
    },
    "C1_14": {
        "text": "자외선 노출 후 피부가 민감해지고 트러블이 난다",
        # 개선: UV → 민감+트러블 복합 표현
        "weights": {"acne": 0.4, "ox": 0.6, "sen": 0.4}
    },
    "C1_15": {
        "text": "등이나 가슴에도 여드름이 동반된다",
        # 추가: 전신성 여드름 패턴 (안드로겐성 강력 지표)
        "weights": {"acne": 0.7, "seb": 0.5}
    },

    # ── Category 2: 유분 & 메이크업 지속력 (개선 완료) ───────────
    "C2_01": {
        "text": "오후만 되면 얼굴이 번들거린다",
        "weights": {"seb": 0.8, "makeup_stability": 0.6}
    },
    "C2_02": {
        "text": "T존(이마·코)이 유독 기름진다",
        # 개선: T존 통합 (이마+코 해부학적 동일)
        "weights": {"seb": 0.8, "makeup_stability": 0.5}
    },
    "C2_03": {
        "text": "세안 2시간 이내에 피지가 다시 분비된다",
        # 추가: 핵심 지성 진단 지표
        "weights": {"seb": 0.9, "acne": 0.2}
    },
    "C2_04": {
        "text": "메이크업이 3~4시간 안에 무너진다",
        "weights": {"makeup_stability": 0.9, "seb": 0.6}
    },
    "C2_05": {
        "text": "파운데이션이 모공에 끼거나 들뜬다",
        "weights": {"texture": 0.7, "seb": 0.5, "makeup_stability": 0.5}
    },
    "C2_06": {
        "text": "쿠션·베이스 제품이 금방 밀리고 들뜬다",
        # 개선: C2_06+07+08 통합
        "weights": {"makeup_stability": 0.8, "seb": 0.5}
    },
    "C2_07": {
        "text": "겉은 번들거리는데 속은 건조하다 (수부지 패턴)",
        "weights": {"seb": 0.6, "hyd": 0.6, "bar": 0.4}
    },
    "C2_08": {
        "text": "피지 때문에 피부톤이 탁해 보인다",
        "weights": {"seb": 0.6, "pigment": 0.3, "ox": 0.3}
    },
    "C2_09": {
        "text": "파우더를 써도 금방 다시 번들거린다",
        "weights": {"seb": 0.9, "makeup_stability": 0.7}
    },
    "C2_10": {
        "text": "시간이 지나면서 메이크업 색상이 어두워진다",
        # 개선: '다크닝' → 소비자 언어
        "weights": {"makeup_stability": 0.7, "ox": 0.4, "seb": 0.4}
    },
    "C2_11": {
        "text": "코 옆·볼이 쉽게 무너진다",
        "weights": {"seb": 0.7, "makeup_stability": 0.6, "texture": 0.3}
    },
    "C2_12": {
        "text": "블러·프라이머 제품이 오래 유지되지 않는다",
        "weights": {"makeup_stability": 0.8, "seb": 0.5}
    },
    "C2_13": {
        "text": "여름철에 유독 번들거림이 심해진다",
        "weights": {"seb": 0.7, "makeup_stability": 0.5, "ox": 0.3}
    },
    "C2_14": {
        "text": "T존과 볼의 유분 차이가 극명하다 (복합성 패턴)",
        # 추가: 복합성 진단 핵심 지표
        "weights": {"seb": 0.6, "hyd": 0.4, "makeup_stability": 0.4}
    },
    "C2_15": {
        "text": "저녁에 컨실러·눈 밑 메이크업이 번진다",
        "weights": {"makeup_stability": 0.7, "seb": 0.4}
    },

    # ── Category 3: 건조 & 수분 부족 (개선 완료) ─────────────────
    "C3_01": {
        "text": "세안 직후 심하게 당긴다",
        "weights": {"hyd": 0.9, "bar": 0.5}
    },
    "C3_02": {
        "text": "크림을 발라도 1~2시간 내 건조해진다",
        "weights": {"hyd": 0.8, "bar": 0.7}
    },
    "C3_03": {
        "text": "각질이 눈에 보이게 들뜬다",
        "weights": {"hyd": 0.7, "texture": 0.5, "bar": 0.4}
    },
    "C3_04": {
        "text": "메이크업이 들뜨거나 갈라진다",
        "weights": {"hyd": 0.7, "makeup_stability": 0.6, "bar": 0.3}
    },
    "C3_05": {
        "text": "피부가 전반적으로 푸석해 보인다",
        "weights": {"hyd": 0.8, "aging": 0.3}
    },
    "C3_06": {
        "text": "건조할 때 잔주름이 더 도드라진다",
        "weights": {"hyd": 0.6, "aging": 0.5}
    },
    "C3_07": {
        "text": "눈가·입 주변이 특히 건조하다",
        "weights": {"hyd": 0.7, "aging": 0.4, "bar": 0.3}
    },
    "C3_08": {
        "text": "입술 주변이 쉽게 갈라진다",
        "weights": {"hyd": 0.8, "bar": 0.4}
    },
    "C3_09": {
        "text": "겨울·에어컨·히터 환경에서 특히 심해진다",
        "weights": {"hyd": 0.7, "bar": 0.4, "sen": 0.2}
    },
    "C3_10": {
        "text": "수분팩을 해도 효과가 오래 유지되지 않는다",
        "weights": {"hyd": 0.7, "bar": 0.6}
    },
    "C3_11": {
        "text": "아침 세안 전 피부가 뻣뻣하고 조인다",
        # 추가: 수분 결핍 야간 지표
        "weights": {"hyd": 0.8, "bar": 0.4}
    },
    "C3_12": {
        "text": "수분 제품을 여러 겹 발라야 괜찮다",
        "weights": {"hyd": 0.6, "bar": 0.6}
    },
    "C3_13": {
        "text": "보습 후에도 피부가 빠르게 수분을 잃는 느낌이다",
        "weights": {"hyd": 0.7, "bar": 0.6}
    },
    "C3_14": {
        "text": "피부가 얇아지면서 실핏줄이 비쳐 보인다",
        # 개선: 얇아짐 → 실핏줄 비침으로 Cat3 고유화
        "weights": {"bar": 0.6, "hyd": 0.5, "sen": 0.4}
    },
    "C3_15": {
        "text": "기내나 건조한 환경에서 피부가 조여드는 느낌이 심하다",
        # 추가
        "weights": {"hyd": 0.7, "bar": 0.3}
    },

    # ── Category 4: 민감 & 붉어짐 (개선 완료) ────────────────────
    "C4_01": {
        "text": "쉽게 붉어진다",
        "weights": {"sen": 0.8, "bar": 0.5}
    },
    "C4_02": {
        "text": "세안 후 얼굴이 빨개진다",
        "weights": {"sen": 0.8, "bar": 0.6}
    },
    "C4_03": {
        "text": "따갑거나 화끈거린다",
        "weights": {"sen": 0.9, "bar": 0.5}
    },
    "C4_04": {
        "text": "각질 제거 후 오래 자극이 간다",
        "weights": {"sen": 0.7, "bar": 0.7}
    },
    "C4_05": {
        "text": "산 계열 활성 성분(AHA·BHA·비타민C) 사용 시 따갑다",
        # 개선: 제품명 → 성분 계열
        "weights": {"sen": 0.8, "bar": 0.5}
    },
    "C4_06": {
        "text": "레티놀류 사용 후 박피·자극 반응이 심하다",
        "weights": {"sen": 0.7, "bar": 0.6}
    },
    "C4_07": {
        "text": "온도 변화에 민감하다",
        "weights": {"sen": 0.7, "bar": 0.4}
    },
    "C4_08": {
        "text": "추운 날씨에 바로 붉어진다",
        "weights": {"sen": 0.7, "bar": 0.4}
    },
    "C4_09": {
        "text": "더운 환경·운동 후 열감과 홍조가 오래 지속된다",
        # 개선: 혈관 과반응 추가
        "weights": {"sen": 0.7, "ox": 0.3}
    },
    "C4_10": {
        "text": "스트레스를 받으면 피부가 붉어진다",
        "weights": {"sen": 0.7, "bar": 0.3}
    },
    "C4_11": {
        "text": "새로운 제품을 사용하기 두렵다",
        "weights": {"sen": 0.6, "bar": 0.5}
    },
    "C4_12": {
        "text": "향료·알코올 함유 제품에 바로 반응한다",
        # 개선: 알코올 추가
        "weights": {"sen": 0.8, "bar": 0.5}
    },
    "C4_13": {
        "text": "피부가 가렵다",
        "weights": {"sen": 0.7, "bar": 0.6}
    },
    "C4_14": {
        "text": "붉음과 건조가 동시에 나타난다",
        "weights": {"sen": 0.6, "bar": 0.7, "hyd": 0.5}
    },
    "C4_15": {
        "text": "뺨이나 코 주변에 붉은 실핏줄이 비쳐 보인다",
        # 개선: Couperose/Rosacea 구체화
        "weights": {"sen": 0.7, "aging": 0.3, "bar": 0.4}
    },

    # ── Category 5: 색소 & 피부톤 (개선 완료) ────────────────────
    "C5_01": {
        "text": "잡티가 점점 짙어졌다",
        "weights": {"pigment": 0.9, "ox": 0.4}
    },
    "C5_02": {
        "text": "기미가 있다",
        "weights": {"pigment": 0.9, "ox": 0.5}
    },
    "C5_03": {
        "text": "여드름 자국이 갈색·검게 오래 남는다 (PIH)",
        # 개선: PIH 명확화, Cat1의 PIE와 분리
        "weights": {"pigment": 0.8, "acne": 0.2}
    },
    "C5_04": {
        "text": "피부톤이 고르지 않다",
        "weights": {"pigment": 0.8, "texture": 0.3}
    },
    "C5_05": {
        "text": "얼굴이 칙칙하고 생기가 없다",
        "weights": {"pigment": 0.7, "ox": 0.6}
    },
    "C5_06": {
        "text": "자외선 후 색이 쉽게 진해진다",
        "weights": {"pigment": 0.8, "ox": 0.7}
    },
    "C5_07": {
        "text": "코 옆·입 주변이 어둡다",
        "weights": {"pigment": 0.6, "texture": 0.3}
    },
    "C5_08": {
        "text": "다크서클이 갈색빛을 띤다 (멜라닌형)",
        # 개선: '색소형' → '갈색빛·멜라닌형'
        "weights": {"pigment": 0.6, "aging": 0.2}
    },
    "C5_09": {
        "text": "피부가 회색빛·산화된 느낌으로 보인다",
        # 개선: ox 가중치 강화
        "weights": {"pigment": 0.4, "ox": 0.7, "hyd": 0.3}
    },
    "C5_10": {
        "text": "광채가 없고 화장해도 생기가 없다",
        "weights": {"pigment": 0.5, "ox": 0.5, "hyd": 0.4}
    },
    "C5_11": {
        "text": "목과 얼굴 톤이 다르다",
        "weights": {"pigment": 0.7, "ox": 0.4}
    },
    "C5_12": {
        "text": "얼굴 중앙만 붉거나 어둡다",
        "weights": {"pigment": 0.6, "sen": 0.3}
    },
    "C5_13": {
        "text": "잡티·기미가 점점 늘어난 느낌이다",
        "weights": {"pigment": 0.8, "ox": 0.5, "aging": 0.3}
    },
    "C5_14": {
        "text": "임신·피임약·호르몬제 복용 후 색소가 짙어졌다",
        # 추가: 호르몬성 기미(Melasma) 특이 지표
        "weights": {"pigment": 0.8, "ox": 0.3}
    },
    "C5_15": {
        "text": "같은 조건에서도 주변 사람보다 빨리 탄다",
        # 추가: Fitzpatrick Type III~IV 패턴
        "weights": {"pigment": 0.7, "ox": 0.5}
    },

    # ── Category 6: 모공 & 피부결 (개선 완료) ─────────────────────
    "C6_01": {
        "text": "모공이 전반적으로 넓어 보인다",
        "weights": {"texture": 0.8, "seb": 0.5}
    },
    "C6_02": {
        "text": "코 모공이 특히 크고 잘 보인다",
        "weights": {"texture": 0.8, "seb": 0.6}
    },
    "C6_03": {
        "text": "볼 모공이 세로로 길쭉하게 늘어져 보인다",
        # 개선: '탄력 없이 늘어짐' → 세로 길쭉 형태 (Sagging pore)
        "weights": {"texture": 0.7, "aging": 0.5}
    },
    "C6_04": {
        "text": "모공이 검게 막혀 블랙헤드처럼 보인다 (산화 피지)",
        # 개선: Cat6 관점 = 모공 막힘으로 재정의
        "weights": {"seb": 0.7, "texture": 0.7, "acne": 0.2}
    },
    "C6_05": {
        "text": "모공이 크림·파운데이션을 먹는 느낌이다",
        # 추가: 모공 흡수 현상
        "weights": {"texture": 0.7, "seb": 0.5, "makeup_stability": 0.5}
    },
    "C6_06": {
        "text": "피부결이 거칠다",
        "weights": {"texture": 0.9, "hyd": 0.3}
    },
    "C6_07": {
        "text": "피부가 울퉁불퉁하다",
        "weights": {"texture": 0.9, "acne": 0.3}
    },
    "C6_08": {
        "text": "측면에서 보면 피부가 고르지 않다",
        "weights": {"texture": 0.8}
    },
    "C6_09": {
        "text": "각질이 쌓여 피부가 두꺼운 느낌이다",
        "weights": {"texture": 0.7, "hyd": 0.4, "bar": 0.3}
    },
    "C6_10": {
        "text": "피부가 매끈하지 않고 피부 결이 사진에서 도드라진다",
        # 개선: 사진 기준 추가
        "weights": {"texture": 0.8}
    },
    "C6_11": {
        "text": "세안 후에도 피부가 깨끗해 보이지 않는다",
        "weights": {"texture": 0.6, "seb": 0.5, "acne": 0.3}
    },
    "C6_12": {
        "text": "피지가 굳어 모공 속에 박혀 있는 느낌이다",
        "weights": {"seb": 0.7, "texture": 0.6}
    },
    "C6_13": {
        "text": "조명 아래에서 피부 요철이 더 도드라진다",
        "weights": {"texture": 0.8}
    },
    "C6_14": {
        "text": "파운데이션을 바르면 모공이 더 잘 보인다",
        "weights": {"texture": 0.7, "seb": 0.4, "makeup_stability": 0.4}
    },
    "C6_15": {
        "text": "피부 결이 고운 편이었는데 최근 거칠어졌다",
        "weights": {"texture": 0.7, "bar": 0.4, "aging": 0.3}
    },

    # ── Category 7: 주름 & 탄력 (개선 완료) ──────────────────────
    "C7_01": {
        "text": "눈가 잔주름이 늘었다",
        "weights": {"aging": 0.8, "hyd": 0.3}
    },
    "C7_02": {
        "text": "웃을 때 주름이 깊다",
        "weights": {"aging": 0.8}
    },
    "C7_03": {
        "text": "입가·팔자 주름이 깊어졌다",
        "weights": {"aging": 0.9}
    },
    "C7_04": {
        "text": "목주름이 생겼다",
        "weights": {"aging": 0.7}
    },
    "C7_05": {
        "text": "턱선이 흐려진 느낌이다",
        "weights": {"aging": 0.8}
    },
    "C7_06": {
        "text": "피부 탄력이 느껴지게 떨어졌다",
        "weights": {"aging": 0.9, "hyd": 0.3}
    },
    "C7_07": {
        "text": "피부가 쉽게 처지고 힘이 없다",
        "weights": {"aging": 0.9}
    },
    "C7_08": {
        "text": "피부가 얇아지면서 탄력도 동시에 저하되었다",
        # 개선: 얇아짐+탄력 연결 (Cat7 고유화)
        "weights": {"aging": 0.7, "bar": 0.4}
    },
    "C7_09": {
        "text": "모공이 탄력 저하로 점점 넓어지는 느낌이다",
        "weights": {"aging": 0.6, "texture": 0.5}
    },
    "C7_10": {
        "text": "화장 후 주름이 도드라진다",
        "weights": {"aging": 0.6, "hyd": 0.4, "makeup_stability": 0.4}
    },
    "C7_11": {
        "text": "피부가 예전보다 덜 탱탱하다",
        "weights": {"aging": 0.9, "ox": 0.3}
    },
    "C7_12": {
        "text": "얼굴 윤곽이 옆에서 보면 이전보다 처져 보인다",
        # 개선: '리프팅 필요' → 증상화
        "weights": {"aging": 0.8}
    },
    "C7_13": {
        "text": "아침에 얼굴이 붓고 저녁에 처져 보인다 (부종+탄력 복합)",
        # 추가
        "weights": {"aging": 0.5, "bar": 0.3, "hyd": 0.3}
    },
    "C7_14": {
        "text": "목을 내렸을 때 이중턱이 생겼다",
        # 추가
        "weights": {"aging": 0.7}
    },
    "C7_15": {
        "text": "이마 주름이 깊어졌다",
        "weights": {"aging": 0.7}
    },

    # ── Category 8: 장벽 & 회복 (개선 완료) ──────────────────────
    "C8_01": {
        "text": "갑자기 모든 제품이 자극적이다",
        "weights": {"bar": 0.9, "sen": 0.7}
    },
    "C8_02": {
        "text": "피부가 갑자기 예민해졌다",
        "weights": {"bar": 0.7, "sen": 0.8}
    },
    "C8_03": {
        "text": "붉음 + 건조 + 트러블이 동시에 있다",
        # Compromised Barrier Triad
        "weights": {"bar": 0.9, "sen": 0.6, "hyd": 0.5, "acne": 0.4}
    },
    "C8_04": {
        "text": "제품을 바꾼 후 피부가 뒤집혔다",
        "weights": {"bar": 0.8, "sen": 0.7}
    },
    "C8_05": {
        "text": "피부가 계속 불안정하고 좋아지지 않는다",
        "weights": {"bar": 0.8, "sen": 0.6}
    },
    "C8_06": {
        "text": "각질 제거 후 회복이 느리다",
        "weights": {"bar": 0.8, "sen": 0.4}
    },
    "C8_07": {
        "text": "레이저·필링 시술 후 민감해졌다",
        "weights": {"bar": 0.7, "sen": 0.6}
    },
    "C8_08": {
        "text": "장벽이 약해진 느낌이다",
        "weights": {"bar": 0.9}
    },
    "C8_09": {
        "text": "작은 자극에도 반응한다",
        "weights": {"sen": 0.8, "bar": 0.7}
    },
    "C8_10": {
        "text": "수분을 유지하지 못하는 느낌이다",
        "weights": {"bar": 0.7, "hyd": 0.6}
    },
    "C8_11": {
        "text": "피부가 쉽게 뜨거워진다",
        "weights": {"sen": 0.7, "bar": 0.5}
    },
    "C8_12": {
        "text": "각질 제거·마사지 등 물리적 자극을 자주 했다",
        # 개선: 주관적 → 원인 이력 객관화
        "weights": {"bar": 0.8, "sen": 0.4}
    },
    "C8_13": {
        "text": "보습 제품을 4단계 이상 발라야 촉촉함이 유지된다",
        # 개선: '여러 제품' → 4단계 이상 증상화
        "weights": {"bar": 0.6, "hyd": 0.5}
    },
    "C8_14": {
        "text": "화장품 흡수가 잘 안 된다",
        "weights": {"bar": 0.7, "texture": 0.4}
    },
    "C8_15": {
        "text": "세안 후 30초 이내 건조함·당김이 온다 (장벽 핵심 지표)",
        # 추가: 가장 강력한 장벽 기능 임상 지표
        "weights": {"bar": 1.0, "hyd": 0.7}
    },
}


# ============================================================
# SECTION 3: HIGH-RISK COMBINATION PATTERN DETECTION
# 임상 근거: 증상 조합이 단순 합산보다 강한 임상적 의미를 가질 때 감지
# ============================================================

@dataclass
class RiskPattern:
    """고위험 조합 패턴 정의"""
    id: str
    name: str                           # 패턴 이름
    name_en: str                        # 영문 패턴명 (Lovable UI용)
    required_symptoms: List[str]        # 필수 증상 (AND 조건)
    optional_symptoms: List[str]        # 보조 증상 (OR 조건, 1개 이상)
    min_optional: int                   # optional 최소 충족 수
    axis_boosts: Dict[str, float]       # 해당 축 배수 증폭
    severity_boost: float               # 전체 심각도 부스트 계수
    clinical_explanation: str           # 임상 설명 (한국어)
    clinical_explanation_en: str        # 임상 설명 (영문 UI용)
    recommendation_flag: str            # 특수 추천 플래그
    urgency: str                        # LOW / MEDIUM / HIGH / CRITICAL


HIGH_RISK_PATTERNS: List[RiskPattern] = [

    # ── Pattern 1: Compromised Barrier Triad (장벽 붕괴 삼위일체) ──
    RiskPattern(
        id="PATTERN_BARRIER_TRIAD",
        name="장벽 붕괴 삼위일체",
        name_en="Compromised Barrier Triad",
        required_symptoms=["C8_03", "C8_01"],
        optional_symptoms=["C4_14", "C3_02", "C8_08", "C8_15"],
        min_optional=2,
        axis_boosts={"bar": 1.5, "sen": 1.3, "hyd": 1.2},
        severity_boost=1.3,
        clinical_explanation=(
            "붉음·건조·트러블의 동시 발현은 피부 장벽의 세 기능이 "
            "동시에 무너진 상태입니다. 이는 단순 건성·민감 피부가 아닌 "
            "'Sensitized Skin Syndrome'으로, 세라마이드 결핍과 "
            "신경원성 염증이 복합된 상태입니다."
        ),
        clinical_explanation_en=(
            "Simultaneous redness, dryness and breakouts signal a "
            "Sensitized Skin Syndrome — ceramide depletion combined "
            "with neurogenic inflammation. Barrier-first protocol essential."
        ),
        recommendation_flag="BARRIER_EMERGENCY",
        urgency="CRITICAL"
    ),

    # ── Pattern 2: Hormonal Acne Cascade (호르몬성 여드름 연쇄) ──
    RiskPattern(
        id="PATTERN_HORMONAL_ACNE",
        name="호르몬성 여드름 연쇄 패턴",
        name_en="Hormonal Acne Cascade",
        required_symptoms=["C1_03", "C1_02"],
        optional_symptoms=["C1_07", "C1_08", "C1_12", "C1_15"],
        min_optional=2,
        axis_boosts={"acne": 1.5, "seb": 1.3},
        severity_boost=1.25,
        clinical_explanation=(
            "턱선·볼·이마의 호르몬 주기성 여드름과 결절/낭종성 여드름은 "
            "안드로겐 수용체 과활성을 나타냅니다. BHA 단독 케어보다 "
            "항안드로겐 경로(나이아신아마이드 10%)와 호르몬 주기 트래킹이 필요합니다."
        ),
        clinical_explanation_en=(
            "Cyclical acne on jaw, cheeks and forehead with nodular/cystic "
            "lesions indicates androgen receptor hyperactivation. "
            "Niacinamide + sebum-control protocol recommended."
        ),
        recommendation_flag="HORMONAL_ACNE_PROTOCOL",
        urgency="HIGH"
    ),

    # ── Pattern 3: Dehydrated Oily (지성·탈수 복합 패턴) ──────────
    RiskPattern(
        id="PATTERN_DEHYDRATED_OILY",
        name="지성·탈수 복합 패턴 (수부지)",
        name_en="Dehydrated Oily Skin Pattern",
        required_symptoms=["C2_07", "C2_01"],
        optional_symptoms=["C3_01", "C2_14", "C6_04", "C1_11"],
        min_optional=2,
        axis_boosts={"seb": 1.2, "hyd": 1.3, "bar": 1.1},
        severity_boost=1.1,
        clinical_explanation=(
            "겉은 번들거리고 속은 건조한 '수부지' 패턴은 피지선 과항진과 "
            "각질층 수분 결핍이 동시에 나타나는 상태입니다. "
            "과도한 세안이나 알코올 성분이 원인일 수 있으며, "
            "히알루론산 수분 공급 후 유분 케어 순서가 핵심입니다."
        ),
        clinical_explanation_en=(
            "Oily surface with dry underneath indicates concurrent sebum "
            "hypersecretion and stratum corneum dehydration — "
            "the 'dehydrated oily' phenotype. Hydration-first, then "
            "sebum regulation protocol."
        ),
        recommendation_flag="HYDRATION_FIRST",
        urgency="MEDIUM"
    ),

    # ── Pattern 4: Photo-Aging Oxidation (광노화·산화 가속 패턴) ──
    RiskPattern(
        id="PATTERN_PHOTOAGING",
        name="광노화·산화 가속 패턴",
        name_en="Photo-Oxidative Aging Pattern",
        required_symptoms=["C5_06", "C5_13"],
        optional_symptoms=["C7_11", "C7_03", "C5_02", "C5_15"],
        min_optional=2,
        axis_boosts={"ox": 1.5, "pigment": 1.4, "aging": 1.3},
        severity_boost=1.3,
        clinical_explanation=(
            "자외선 후 빠른 색소 진화와 기미·잡티 증가는 "
            "광노화(Photoaging) 가속 상태를 나타냅니다. "
            "UVA 침투로 진피 콜라겐이 분해되고 멜라닌 합성이 과활성화된 상태이며, "
            "비타민C + 레티날 + 물리적 자차(SPF50+) 조합이 필수입니다."
        ),
        clinical_explanation_en=(
            "Rapid post-UV pigmentation with increasing melasma and lentigines "
            "indicates accelerated photoaging. UVA-induced collagen breakdown "
            "and melanocyte hyperactivation. Vitamin C + Retinal + Physical SPF50+ essential."
        ),
        recommendation_flag="ANTIOXIDANT_PRIORITY",
        urgency="HIGH"
    ),

    # ── Pattern 5: Couperose / Rosacea Risk (홍조·혈관 과반응) ────
    RiskPattern(
        id="PATTERN_COUPEROSE",
        name="홍조·혈관 과반응 패턴 (Couperose)",
        name_en="Couperose / Vascular Hyperreactivity",
        required_symptoms=["C4_15", "C4_09"],
        optional_symptoms=["C4_01", "C4_08", "C4_07", "C4_02"],
        min_optional=2,
        axis_boosts={"sen": 1.4, "bar": 1.2},
        severity_boost=1.2,
        clinical_explanation=(
            "뺨·코의 실핏줄 + 지속적 홍조는 Couperose(혈관 확장)이나 "
            "Rosacea Type I의 전구 증상입니다. "
            "온도 자극·알코올·향료를 피하고 나이아신아마이드·아제라익산 계열 "
            "제품이 혈관 과반응 억제에 효과적입니다."
        ),
        clinical_explanation_en=(
            "Visible capillaries with persistent flushing signal Couperose "
            "or early Rosacea Type I. Avoid thermal triggers, alcohol, "
            "fragrance. Niacinamide + Azelaic acid protocol recommended."
        ),
        recommendation_flag="ANTI_REDNESS_PROTOCOL",
        urgency="HIGH"
    ),

    # ── Pattern 6: Severe Inflammatory Acne (중증 염증성 여드름) ──
    RiskPattern(
        id="PATTERN_SEVERE_ACNE",
        name="중증 염증성 여드름 (IGA Grade 3+)",
        name_en="Severe Inflammatory Acne",
        required_symptoms=["C1_07", "C1_08"],
        optional_symptoms=["C1_01", "C1_03", "C1_15", "C1_12"],
        min_optional=2,
        axis_boosts={"acne": 1.6, "seb": 1.2, "sen": 1.1},
        severity_boost=1.4,
        clinical_explanation=(
            "결절성·낭종성 여드름의 동시 발현은 IGA Grade 3 이상으로 "
            "피부과 전문의 상담을 권장합니다. "
            "자가 압출은 PIH(색소 침착)와 흉터를 악화시킵니다. "
            "BHA + 나이아신아마이드 루틴과 함께 전문 시술 병행을 고려하세요."
        ),
        clinical_explanation_en=(
            "Concurrent nodular and pustular acne = IGA Grade 3+. "
            "Dermatologist consultation strongly advised. "
            "Self-extraction risks PIH and scarring. "
            "BHA + Niacinamide routine as adjunct therapy."
        ),
        recommendation_flag="DERMATOLOGIST_REFERRAL",
        urgency="CRITICAL"
    ),

    # ── Pattern 7: Accelerated Aging Triad (노화 가속 삼중 패턴) ──
    RiskPattern(
        id="PATTERN_AGING_TRIAD",
        name="노화 가속 삼중 패턴",
        name_en="Accelerated Aging Triad",
        required_symptoms=["C7_06", "C7_11"],
        optional_symptoms=["C7_03", "C7_07", "C7_12", "C7_14", "C5_13"],
        min_optional=3,
        axis_boosts={"aging": 1.5, "ox": 1.3},
        severity_boost=1.35,
        clinical_explanation=(
            "탄력 저하·주름·처짐의 복합 발현은 콜라겐 합성 감소와 "
            "진피 ECM(세포외기질) 분해가 가속된 상태입니다. "
            "레티날(Retinal) + 펩타이드 + 콜라겐 부스터 + "
            "산화 스트레스 방어(비타민C)의 4단계 안티에이징 루틴이 필요합니다."
        ),
        clinical_explanation_en=(
            "Combined elasticity loss, deep wrinkles and sagging signal "
            "accelerated collagen synthesis decline and ECM degradation. "
            "4-step anti-aging: Retinal + Peptide + Collagen booster + Vitamin C."
        ),
        recommendation_flag="DEVICE_RECOMMENDED",  # EMS 디바이스 트리거
        urgency="HIGH"
    ),

    # ── Pattern 8: Over-Exfoliation Syndrome (과각질 제거 증후군) ──
    RiskPattern(
        id="PATTERN_OVER_EXFOLIATION",
        name="과각질 제거 증후군",
        name_en="Over-Exfoliation Syndrome",
        required_symptoms=["C8_12", "C8_06"],
        optional_symptoms=["C8_01", "C8_04", "C4_04", "C4_05"],
        min_optional=2,
        axis_boosts={"bar": 1.6, "sen": 1.4},
        severity_boost=1.4,
        clinical_explanation=(
            "잦은 물리적 자극 후 회복 지연은 각질층이 과손상된 상태입니다. "
            "모든 활성 성분(산류, 레티놀)을 즉시 중단하고 "
            "세라마이드 + 판테놀 중심의 장벽 재건 루틴으로 "
            "최소 4주 안정화가 필요합니다."
        ),
        clinical_explanation_en=(
            "Repeated physical exfoliation with impaired recovery indicates "
            "stratum corneum over-damage. Stop all active ingredients. "
            "Ceramide + Panthenol barrier-rebuild protocol. "
            "Minimum 4 weeks stabilization required."
        ),
        recommendation_flag="ACTIVE_INGREDIENT_PAUSE",
        urgency="CRITICAL"
    ),
]


def detect_risk_patterns(
    checked_symptoms: List[str]
) -> List[Tuple[RiskPattern, bool]]:
    """
    고위험 조합 패턴 감지
    반환: (패턴 객체, 트리거 여부) 리스트
    감지 조건:
      - required_symptoms 전부 체크됨 (AND)
      - optional_symptoms 중 min_optional개 이상 체크됨 (OR)
    """
    detected = []
    symptom_set = set(checked_symptoms)

    for pattern in HIGH_RISK_PATTERNS:
        required_met = all(s in symptom_set for s in pattern.required_symptoms)
        optional_count = sum(1 for s in pattern.optional_symptoms if s in symptom_set)
        triggered = required_met and (optional_count >= pattern.min_optional)
        if triggered:
            detected.append(pattern)

    return detected


def apply_pattern_boosts(
    scores: Dict[str, float],
    detected_patterns: List[RiskPattern]
) -> Tuple[Dict[str, float], List[str]]:
    """
    감지된 패턴의 축 증폭 적용
    수식: boosted_score = score × axis_boost (단, max 100)
    반환: (증폭된 점수, 활성화된 플래그 리스트)
    """
    boosted = dict(scores)
    flags = []

    for pattern in detected_patterns:
        for axis, multiplier in pattern.axis_boosts.items():
            boosted[axis] = min(boosted.get(axis, 0.0) * multiplier, 100.0)
        flags.append(pattern.recommendation_flag)

    return boosted, flags


# ============================================================
# SECTION 4: CONTEXT MODIFIERS & SKIN TYPE BASELINE (유지)
# ============================================================

CONTEXT_MODIFIERS: Dict[str, Dict[str, float]] = {
    "shaving":           {"sen": 0.15, "bar": 0.10, "acne": 0.10},
    "makeup":            {"makeup_stability": 0.20, "seb": 0.10},
    "hormonal":          {"acne": 0.20, "seb": 0.15, "sen": 0.10},
    "outdoor_work":      {"ox": 0.25, "pigment": 0.15},
    "skincare_beginner": {"bar": 0.10, "sen": 0.05},
    "recent_procedure":  {"bar": 0.20, "sen": 0.20},
    "low_water_intake":  {"hyd": 0.15},          # v2에서 C3_11 제거 → Context로 이동
}

SKIN_TYPE_BASELINES: Dict[str, Dict[str, float]] = {
    "dry":          {"hyd": 15, "bar": 10, "sen": 5},
    "oily":         {"seb": 20, "acne": 10, "texture": 10, "makeup_stability": 10},
    "combination":  {"seb": 10, "hyd": 8, "texture": 8, "makeup_stability": 8},
    "sensitive":    {"sen": 20, "bar": 15},
    "normal":       {},
}


# ============================================================
# SECTION 5: PRODUCT CATALOG WITH SHOPIFY HANDLE MAPPING
# ============================================================

PRODUCT_CATALOG = {
    # Phase 1 — Cleanser
    "biplain_cleanser": {
        "name": "B'Plain 녹두 약산성 클렌징폼",
        "brand": "비플레인",
        "phase": "Phase1",
        "type": "민감용 클렌저",
        "price_eur": 18,
        "tier": ["Entry", "Full", "Premium"],
        "shopify_handle": "biplain-greenbean-foam-cleanser",
        "key_ingredients": ["녹두추출물", "아미노산 계면활성제", "pH5.5"],
        "target_axes": ["sen", "bar"],
        "for_skin": ["sensitive", "dry", "normal"]
    },
    "drg_cleanser_oily": {
        "name": "Dr.G 약산성 클렌징 젤폼",
        "brand": "Dr.G",
        "phase": "Phase1",
        "type": "지성용 클렌저",
        "price_eur": 16,
        "tier": ["Entry", "Full", "Premium"],
        "shopify_handle": "drg-ph-balancing-cleanser",
        "key_ingredients": ["살리실산", "5-바이옴", "히알루론산 8중", "pH5.5"],
        "target_axes": ["seb", "acne", "texture"],
        "for_skin": ["oily", "combination"]
    },
    # Phase 2A — Hydration Fluid
    "torriden_serum": {
        "name": "토리든 다이브인 히알루론산 세럼",
        "brand": "Torriden",
        "phase": "Phase2A",
        "type": "수분 세럼",
        "price_eur": 22,
        "tier": ["Full", "Premium"],
        "shopify_handle": "torriden-dive-in-low-molecular-hyaluronic-acid-serum",
        "key_ingredients": ["히알루론산 5종", "판테놀", "알코올프리"],
        "target_axes": ["hyd", "bar"],
        "for_skin": ["dry", "combination", "sensitive", "normal"]
    },
    "snature_toner": {
        "name": "S.NATURE 아쿠아 오아시스 토너",
        "brand": "S.NATURE",
        "phase": "Phase2A",
        "type": "수분 토너",
        "price_eur": 14,
        "tier": ["Entry"],
        "shopify_handle": "snature-aqua-oasis-toner",
        "key_ingredients": ["히알루론산", "판테놀", "알코올프리"],
        "target_axes": ["hyd"],
        "for_skin": ["all"]
    },
    # Phase 2B — Barrier Booster
    "aestura_cream": {
        "name": "에스트라 아토베리어365 크림",
        "brand": "Aestura",
        "phase": "Phase2B",
        "type": "장벽 크림",
        "price_eur": 38,
        "tier": ["Full", "Premium"],
        "shopify_handle": "aestura-atobarrier365-cream",
        "key_ingredients": ["세라마이드NP", "스쿠알란", "콜레스테롤", "판테놀"],
        "target_axes": ["bar", "hyd", "sen"],
        "for_skin": ["sensitive", "dry", "combination"]
    },
    "snature_squalane": {
        "name": "S.NATURE 아쿠아 스쿠알란 세럼",
        "brand": "S.NATURE",
        "phase": "Phase2B",
        "type": "스쿠알란 세럼",
        "price_eur": 20,
        "tier": ["Entry", "Full"],
        "shopify_handle": "snature-aqua-squalane-serum",
        "key_ingredients": ["스쿠알란", "판테놀", "알란토인"],
        "target_axes": ["bar", "hyd"],
        "for_skin": ["all"]
    },
    # Phase 2C — Microbiome
    "manyo_bifida": {
        "name": "마녀공장 비피다 바이옴 앰플",
        "brand": "Manyo Factory",
        "phase": "Phase2C",
        "type": "마이크로바이옴 앰플",
        "price_eur": 32,
        "tier": ["Full", "Premium"],
        "shopify_handle": "manyo-bifida-biome-complex-ampoule",
        "key_ingredients": ["비피다발효용해물", "히알루론산 10종", "마데카소사이드"],
        "target_axes": ["bar", "sen", "hyd"],
        "for_skin": ["sensitive", "dry", "combination"]
    },
    "bioheal_probioderm": {
        "name": "Bioheal BOH 프로바이오덤 세럼",
        "brand": "Bioheal BOH",
        "phase": "Phase2C",
        "type": "프리미엄 마이크로바이옴 세럼",
        "price_eur": 42,
        "tier": ["Premium"],
        "shopify_handle": "bioheal-boh-probioderm-collagen-remodeling-serum",
        "key_ingredients": ["탄탄바이오메특허", "12종 펩타이드", "콜라겐"],
        "target_axes": ["bar", "sen", "aging"],
        "for_skin": ["all"]
    },
    # Phase 3 — Acne
    "cosrx_bha": {
        "name": "COSRX BHA 블랙헤드 파워 리퀴드",
        "brand": "COSRX",
        "phase": "Phase3_Acne",
        "type": "BHA 엑스폴리에이터",
        "price_eur": 22,
        "tier": ["Full", "Premium"],
        "shopify_handle": "cosrx-bha-blackhead-power-liquid",
        "key_ingredients": ["살리실산(BHA)", "나이아신아마이드"],
        "target_axes": ["acne", "seb", "texture"],
        "for_skin": ["oily", "combination"]
    },
    "bringgreen_teatree": {
        "name": "Bring Green 티트리 시카 수딩 토너",
        "brand": "Bring Green",
        "phase": "Phase3_Acne",
        "type": "진정 토너",
        "price_eur": 15,
        "tier": ["Entry", "Full"],
        "shopify_handle": "bring-green-teatree-cica-soothing-toner",
        "key_ingredients": ["3중 티트리 50%", "병풀", "AHA"],
        "target_axes": ["acne", "sen"],
        "for_skin": ["oily", "combination", "sensitive"]
    },
    # Phase 3 — Pigment
    "missha_vitac": {
        "name": "미샤 비타씨플러스 잡티씨 앰플",
        "brand": "MISSHA",
        "phase": "Phase3_Pigment",
        "type": "미백 앰플",
        "price_eur": 35,
        "tier": ["Full", "Premium"],
        "shopify_handle": "missha-vita-c-plus-spot-correcting-and-firming-ampoule",
        "key_ingredients": ["비타민C", "트라넥사믹산", "나이아신아마이드"],
        "target_axes": ["pigment", "ox", "aging"],
        "for_skin": ["all"]
    },
    "cellfusionc_toning": {
        "name": "Cell Fusion C 토닝 C 세럼",
        "brand": "Cell Fusion C",
        "phase": "Phase3_Pigment",
        "type": "비타민C 세럼",
        "price_eur": 38,
        "tier": ["Premium"],
        "shopify_handle": "cell-fusion-c-toning-c-dark-spot-serum",
        "key_ingredients": ["순수 비타민C", "미백케어"],
        "target_axes": ["pigment", "ox"],
        "for_skin": ["all"]
    },
    # Phase 3 — Aging
    "iope_retinol": {
        "name": "아이오페 레티놀 슈퍼 바운스 세럼",
        "brand": "IOPE",
        "phase": "Phase3_Aging",
        "type": "레티놀 세럼",
        "price_eur": 52,
        "tier": ["Full", "Premium"],
        "shopify_handle": "iope-retinol-super-bounce-serum",
        "key_ingredients": ["레티날", "펩타이드", "히알루론산"],
        "target_axes": ["aging", "texture"],
        "for_skin": ["all"]
    },
    "bioheal_collagen": {
        "name": "Bioheal BOH 프로바이오덤 콜라겐 세럼",
        "brand": "Bioheal BOH",
        "phase": "Phase3_Aging",
        "type": "콜라겐·펩타이드 세럼",
        "price_eur": 45,
        "tier": ["Premium"],
        "shopify_handle": "bioheal-boh-probioderm-collagen-remodeling-intensive-serum",
        "key_ingredients": ["콜라겐T1&T3", "12종 펩타이드", "바이오메"],
        "target_axes": ["aging", "bar", "texture"],
        "for_skin": ["all"]
    },
    # Phase 4 — Seal
    "drg_soothing_cream": {
        "name": "Dr.G 레드블레미쉬 수딩크림",
        "brand": "Dr.G",
        "phase": "Phase4",
        "type": "젤크림 (지성용)",
        "price_eur": 20,
        "tier": ["Entry", "Full", "Premium"],
        "shopify_handle": "drg-red-blemish-clear-soothing-cream",
        "key_ingredients": ["마데카소사이드", "판테놀", "알로에"],
        "target_axes": ["acne", "sen", "bar"],
        "for_skin": ["oily", "combination"]
    },
    "snature_moistcream": {
        "name": "S.NATURE 아쿠아 스쿠알란 수분크림",
        "brand": "S.NATURE",
        "phase": "Phase4",
        "type": "수분크림",
        "price_eur": 25,
        "tier": ["Full", "Premium"],
        "shopify_handle": "snature-aqua-squalane-moisture-cream",
        "key_ingredients": ["스쿠알란", "히알루론산", "판테놀"],
        "target_axes": ["hyd", "bar"],
        "for_skin": ["dry", "combination", "normal"]
    },
    # Phase 5 — Protect (Always included)
    "cellfusionc_sunscreen": {
        "name": "Cell Fusion C 레이저 선스크린 100",
        "brand": "Cell Fusion C",
        "phase": "Phase5",
        "type": "하이브리드 선크림",
        "price_eur": 32,
        "tier": ["Full", "Premium"],
        "shopify_handle": "cell-fusion-c-laser-sunscreen-100-spf50",
        "key_ingredients": ["SPF50+/PA++++", "PDRN", "무기+유기 하이브리드"],
        "target_axes": ["ox", "pigment", "sen"],
        "for_skin": ["all"]
    },
    "drg_sunscreen": {
        "name": "Dr.G 그린 마일드 업 선 플러스",
        "brand": "Dr.G",
        "phase": "Phase5",
        "type": "무기자차 선크림",
        "price_eur": 20,
        "tier": ["Entry"],
        "shopify_handle": "drg-green-mild-up-sun-plus-spf50",
        "key_ingredients": ["SPF50+/PA++++", "무기자차", "그린티"],
        "target_axes": ["ox", "sen"],
        "for_skin": ["all"]
    },
    # Device
    "medicube_booster": {
        "name": "메디큐브 AGE-R 부스터 프로",
        "brand": "Medicube",
        "phase": "Device",
        "type": "EMS+LED 올인원 기기",
        "price_eur": 380,
        "tier": ["Premium"],
        "shopify_handle": "medicube-age-r-booster-pro-ems-device",
        "key_ingredients": ["EMS", "미세전류", "LED포토테라피"],
        "target_axes": ["aging", "texture", "bar"],
        "for_skin": ["all"]
    },
    "mamicare_device": {
        "name": "Mamicare 홈케어 LED 디바이스",
        "brand": "Mamicare",
        "phase": "Device",
        "type": "LED 기기 (가성비형)",
        "price_eur": 89,
        "tier": ["Full"],
        "shopify_handle": "mamicare-homecare-led-device",
        "key_ingredients": ["청색LED(여드름)", "적색LED(재생)"],
        "target_axes": ["acne", "aging", "bar"],
        "for_skin": ["all"]
    },
}


# ============================================================
# SECTION 6: TIER BUNDLE LOGIC (€49 / €79~89 / Premium+Device)
# ============================================================

TIER_DEFINITIONS = {
    "Entry": {
        "label": "Entry Routine",
        "price_range": "€49",
        "description": "핵심 3단계 (클렌저 + 수분 + 선크림)",
        "max_products": 3
    },
    "Full": {
        "label": "Full Protocol",
        "price_range": "€79–89",
        "description": "5단계 완전 루틴 (타겟 세럼 포함)",
        "max_products": 6
    },
    "Premium": {
        "label": "Premium Strategy",
        "price_range": "€149+",
        "description": "프리미엄 전 단계 + 디바이스",
        "max_products": 8
    },
}


def build_product_bundle(
    normalized_scores: Dict[str, float],
    detected_patterns: List[RiskPattern],
    skin_type: str,
    flags: List[str],
    tier: str = "Full"
) -> Dict:
    """
    점수 + 패턴 기반 제품 번들 구성
    Device 조건: aging >= 6 (정규화 기준 46점) 이상
    """
    bundle = {"Phase1": [], "Phase2": [], "Phase3": [], "Phase4": [], "Phase5": [], "Device": []}

    # Phase 1 — 피부 타입 분기
    if normalized_scores.get("seb", 0) >= 40 or normalized_scores.get("acne", 0) >= 30:
        bundle["Phase1"].append(PRODUCT_CATALOG["drg_cleanser_oily"])
    else:
        bundle["Phase1"].append(PRODUCT_CATALOG["biplain_cleanser"])

    # Phase 2
    if normalized_scores.get("hyd", 0) >= 25:
        if tier == "Entry":
            bundle["Phase2"].append(PRODUCT_CATALOG["snature_toner"])
        else:
            bundle["Phase2"].append(PRODUCT_CATALOG["torriden_serum"])

    if normalized_scores.get("bar", 0) >= 35:
        if tier in ["Full", "Premium"]:
            bundle["Phase2"].append(PRODUCT_CATALOG["aestura_cream"])
        else:
            bundle["Phase2"].append(PRODUCT_CATALOG["snature_squalane"])

    if normalized_scores.get("bar", 0) >= 40 and normalized_scores.get("sen", 0) >= 35:
        if tier == "Premium":
            bundle["Phase2"].append(PRODUCT_CATALOG["bioheal_probioderm"])
        elif tier == "Full":
            bundle["Phase2"].append(PRODUCT_CATALOG["manyo_bifida"])

    # Phase 3 — 타겟 (tier Full 이상)
    if tier in ["Full", "Premium"]:
        if normalized_scores.get("acne", 0) >= 35 or normalized_scores.get("seb", 0) >= 45:
            bundle["Phase3"].append(PRODUCT_CATALOG["cosrx_bha"])
            bundle["Phase3"].append(PRODUCT_CATALOG["bringgreen_teatree"])

        if normalized_scores.get("pigment", 0) >= 35 or normalized_scores.get("ox", 0) >= 30:
            if tier == "Premium":
                bundle["Phase3"].append(PRODUCT_CATALOG["cellfusionc_toning"])
            else:
                bundle["Phase3"].append(PRODUCT_CATALOG["missha_vitac"])

        if normalized_scores.get("aging", 0) >= 35 or normalized_scores.get("ox", 0) >= 35:
            if tier == "Premium":
                bundle["Phase3"].append(PRODUCT_CATALOG["bioheal_collagen"])
            bundle["Phase3"].append(PRODUCT_CATALOG["iope_retinol"])

    # Phase 4
    if normalized_scores.get("seb", 0) >= 40:
        bundle["Phase4"].append(PRODUCT_CATALOG["drg_soothing_cream"])
    else:
        bundle["Phase4"].append(PRODUCT_CATALOG["snature_moistcream"])

    # Phase 5 — 항상 포함
    if tier == "Entry":
        bundle["Phase5"].append(PRODUCT_CATALOG["drg_sunscreen"])
    else:
        bundle["Phase5"].append(PRODUCT_CATALOG["cellfusionc_sunscreen"])

    # Device — aging >= 46점 OR DEVICE_RECOMMENDED 플래그
    if normalized_scores.get("aging", 0) >= 46 or "DEVICE_RECOMMENDED" in flags:
        if tier == "Premium":
            bundle["Device"].append(PRODUCT_CATALOG["medicube_booster"])
        elif tier == "Full":
            bundle["Device"].append(PRODUCT_CATALOG["mamicare_device"])

    return bundle


# ============================================================
# SECTION 7: COMPLETE DIAGNOSIS PIPELINE v3
# ============================================================

@dataclass
class DiagnosisInput:
    checked_symptoms: List[str]
    contexts: List[str] = field(default_factory=list)
    skin_type: str = "normal"
    tier: str = "Full"


@dataclass
class DiagnosisResult:
    raw_scores: Dict[str, float]
    normalized_scores: Dict[str, float]
    severity_labels: Dict[str, str]
    primary_concerns: List[str]
    secondary_concerns: List[str]
    detected_patterns: List[RiskPattern]
    active_flags: List[str]
    product_bundle: Dict
    urgency_level: str


def compute_max_possible_scores() -> Dict[str, float]:
    max_scores = {axis: 0.0 for axis in AXIS_KEYS}
    for item in SYMPTOM_WEIGHTS.values():
        for axis, weight in item["weights"].items():
            max_scores[axis] += weight
    return max_scores


def apply_symptom_scores(checked_symptoms: List[str]) -> Dict[str, float]:
    raw = {axis: 0.0 for axis in AXIS_KEYS}
    for symptom_id in checked_symptoms:
        if symptom_id in SYMPTOM_WEIGHTS:
            for axis, weight in SYMPTOM_WEIGHTS[symptom_id]["weights"].items():
                raw[axis] += weight
    return raw


def apply_skin_type_baseline(raw: Dict, skin_type: str) -> Dict:
    baseline = SKIN_TYPE_BASELINES.get(skin_type, {})
    adjusted = dict(raw)
    for axis, val in baseline.items():
        adjusted[axis] = adjusted.get(axis, 0.0) + val
    return adjusted


def apply_context_modifiers(scores: Dict, contexts: List[str], max_scores: Dict) -> Dict:
    modified = dict(scores)
    for context in contexts:
        mods = CONTEXT_MODIFIERS.get(context, {})
        for axis, mod in mods.items():
            modified[axis] = modified.get(axis, 0.0) * (1 + mod)
    return modified


def normalize_scores(scores: Dict, max_scores: Dict) -> Dict:
    normalized = {}
    for axis in AXIS_KEYS:
        mx = max_scores.get(axis, 1.0)
        normalized[axis] = min(round((scores.get(axis, 0.0) / mx) * 100, 2), 100.0) if mx > 0 else 0.0
    return normalized


def classify_severity(score: float) -> str:
    if score <= 20:   return "정상 (Clear)"
    elif score <= 45: return "경등도 (Mild)"
    elif score <= 70: return "중등도 (Moderate)"
    else:             return "중증 (Severe)"


def get_urgency_level(detected_patterns: List[RiskPattern]) -> str:
    if not detected_patterns:
        return "LOW"
    levels = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
    max_level = max(levels[p.urgency] for p in detected_patterns)
    return [k for k, v in levels.items() if v == max_level][0]


def run_diagnosis(inp: DiagnosisInput) -> DiagnosisResult:
    max_scores = compute_max_possible_scores()
    raw = apply_symptom_scores(inp.checked_symptoms)
    with_baseline = apply_skin_type_baseline(raw, inp.skin_type)
    with_context = apply_context_modifiers(with_baseline, inp.contexts, max_scores)

    # 패턴 감지
    detected_patterns = detect_risk_patterns(inp.checked_symptoms)
    boosted_scores, flags = apply_pattern_boosts(with_context, detected_patterns)

    normalized = normalize_scores(boosted_scores, max_scores)
    severity_labels = {ax: classify_severity(sc) for ax, sc in normalized.items()}

    sorted_axes = sorted(normalized.items(), key=lambda x: x[1], reverse=True)
    primary = [ax for ax, sc in sorted_axes if sc >= 46][:3]
    secondary = [ax for ax, sc in sorted_axes if 21 <= sc < 46][:4]

    bundle = build_product_bundle(normalized, detected_patterns, inp.skin_type, flags, inp.tier)
    urgency = get_urgency_level(detected_patterns)

    return DiagnosisResult(
        raw_scores=raw,
        normalized_scores=normalized,
        severity_labels=severity_labels,
        primary_concerns=primary,
        secondary_concerns=secondary,
        detected_patterns=detected_patterns,
        active_flags=flags,
        product_bundle=bundle,
        urgency_level=urgency
    )


# ============================================================
# SECTION 8: JSON EXPORT (Lovable/Frontend 연동용)
# ============================================================

def export_result_json(result: DiagnosisResult, inp: DiagnosisInput) -> str:
    """
    Lovable 프론트엔드로 전달할 JSON 형식 결과
    레이더 차트 데이터 포함
    """
    radar_data = [
        {"axis": ax, "score": result.normalized_scores[ax], "label": AXES[ax]}
        for ax in AXIS_KEYS
    ]

    patterns_data = [
        {
            "id": p.id,
            "name": p.name,
            "name_en": p.name_en,
            "urgency": p.urgency,
            "clinical_explanation": p.clinical_explanation,
            "clinical_explanation_en": p.clinical_explanation_en,
            "flag": p.recommendation_flag
        }
        for p in result.detected_patterns
    ]

    bundle_data = {}
    for phase, products in result.product_bundle.items():
        bundle_data[phase] = [
            {
                "name": p["name"],
                "brand": p["brand"],
                "price_eur": p["price_eur"],
                "shopify_handle": p["shopify_handle"],
                "key_ingredients": p["key_ingredients"],
                "tier": p["tier"]
            }
            for p in products
        ]

    output = {
        "skin_type": inp.skin_type,
        "tier": inp.tier,
        "urgency_level": result.urgency_level,
        "primary_concerns": result.primary_concerns,
        "secondary_concerns": result.secondary_concerns,
        "active_flags": result.active_flags,
        "radar_chart_data": radar_data,
        "severity_labels": result.severity_labels,
        "detected_patterns": patterns_data,
        "product_bundle": bundle_data,
        "domain": "skinstrategylab.de"
    }

    return json.dumps(output, ensure_ascii=False, indent=2)


# ============================================================
# SECTION 9: VISUALIZATION v3
# ============================================================

def plot_clinical_dashboard(
    result: DiagnosisResult,
    title: str = "Skin Strategy Lab — 피부 진단 결과",
    save_path: Optional[str] = None
) -> None:
    """6축 레이더 + 전체 막대 + 패턴 감지 알림 통합 대시보드"""

    fig = plt.figure(figsize=(18, 10))
    fig.patch.set_facecolor('#0a0a0f')

    # 상단 제목
    fig.suptitle(title, color='white', fontsize=14, fontweight='bold', y=0.98)

    # ─ 좌측: 레이더 차트 (6축만 — UI용 간소화)
    ax_radar = fig.add_subplot(131, polar=True)
    ax_radar.set_facecolor('#0d1117')

    key6 = ["seb", "hyd", "bar", "sen", "acne", "aging"]
    label6 = ["Sebum", "Hydration", "Barrier", "Sensitivity", "Acne", "Aging"]
    vals6 = [result.normalized_scores[k] for k in key6] + [result.normalized_scores[key6[0]]]
    angles6 = np.linspace(0, 2*np.pi, len(key6), endpoint=False).tolist()
    angles6 += angles6[:1]

    ax_radar.plot(angles6, vals6, 'o-', lw=2.5, color='#00d4ff')
    ax_radar.fill(angles6, vals6, alpha=0.2, color='#00d4ff')
    for t in [20, 45, 70]:
        tv = [t]*len(key6) + [t]
        ax_radar.plot(angles6, tv, '--', lw=0.7, color='gray', alpha=0.4)
    ax_radar.set_xticks(angles6[:-1])
    ax_radar.set_xticklabels(label6, color='white', size=9)
    ax_radar.set_ylim(0, 100)
    ax_radar.set_yticks([20, 45, 70])
    ax_radar.set_yticklabels(['20', '45', '70'], color='gray', size=7)
    ax_radar.grid(color='gray', ls=':', lw=0.5, alpha=0.4)
    ax_radar.spines['polar'].set_color('gray')
    ax_radar.set_title("6-Axis Skin Profile", color='white', size=10, pad=12)

    # ─ 중앙: 전체 10축 막대
    ax_bar = fig.add_subplot(132)
    ax_bar.set_facecolor('#0d1117')

    axes_list = list(result.normalized_scores.keys())
    scores_list = list(result.normalized_scores.values())
    bar_colors = []
    for s in scores_list:
        if s <= 20: bar_colors.append('#27ae60')
        elif s <= 45: bar_colors.append('#f39c12')
        elif s <= 70: bar_colors.append('#e67e22')
        else: bar_colors.append('#e74c3c')

    bars = ax_bar.barh(axes_list, scores_list, color=bar_colors, edgecolor='#1a1a2e', height=0.6)
    for thresh, col in [(20, '#27ae60'), (45, '#f39c12'), (70, '#e74c3c')]:
        ax_bar.axvline(thresh, color=col, ls='--', lw=1, alpha=0.5)
    for bar, sc in zip(bars, scores_list):
        ax_bar.text(sc+1, bar.get_y()+bar.get_height()/2, f'{sc:.0f}',
                    va='center', color='white', size=8, fontweight='bold')
    ax_bar.set_xlim(0, 108)
    ax_bar.tick_params(colors='white', labelsize=8)
    ax_bar.set_title("All 10 Axes", color='white', size=10)
    ax_bar.spines['bottom'].set_color('gray')
    ax_bar.spines['left'].set_color('gray')
    ax_bar.spines['top'].set_visible(False)
    ax_bar.spines['right'].set_visible(False)
    ax_bar.set_facecolor('#0d1117')

    # ─ 우측: 패턴 감지 패널
    ax_pattern = fig.add_subplot(133)
    ax_pattern.set_facecolor('#0d1117')
    ax_pattern.axis('off')

    urgency_color = {
        "LOW": '#27ae60', "MEDIUM": '#f39c12',
        "HIGH": '#e67e22', "CRITICAL": '#e74c3c'
    }
    uc = urgency_color.get(result.urgency_level, 'white')

    y_pos = 0.95
    ax_pattern.text(0.05, y_pos, "🔍 Risk Pattern Detection",
                    color='white', size=10, fontweight='bold', transform=ax_pattern.transAxes)
    y_pos -= 0.08
    ax_pattern.text(0.05, y_pos, f"Urgency: {result.urgency_level}",
                    color=uc, size=9, fontweight='bold', transform=ax_pattern.transAxes)

    if result.detected_patterns:
        for pat in result.detected_patterns:
            y_pos -= 0.10
            pc = urgency_color.get(pat.urgency, 'white')
            ax_pattern.text(0.05, y_pos, f"⚠ {pat.name_en}",
                            color=pc, size=8, fontweight='bold', transform=ax_pattern.transAxes)
            y_pos -= 0.06
            ax_pattern.text(0.07, y_pos, f"[{pat.urgency}] → {pat.recommendation_flag}",
                            color='#aaaaaa', size=7, transform=ax_pattern.transAxes)
    else:
        y_pos -= 0.10
        ax_pattern.text(0.05, y_pos, "✓ No high-risk patterns detected",
                        color='#27ae60', size=9, transform=ax_pattern.transAxes)

    y_pos -= 0.12
    ax_pattern.text(0.05, y_pos, "📦 Active Flags:",
                    color='white', size=9, fontweight='bold', transform=ax_pattern.transAxes)
    for flag in result.active_flags:
        y_pos -= 0.06
        ax_pattern.text(0.07, y_pos, f"→ {flag}",
                        color='#00d4ff', size=8, transform=ax_pattern.transAxes)

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight', facecolor='#0a0a0f')
    plt.show()


# ============================================================
# DEMO RUN
# ============================================================

if __name__ == "__main__":

    # ─── Test Case 1: 장벽 붕괴 삼위일체 + 과각질 제거 패턴 ───────
    print("\n[TEST v3 — Case 1: 장벽 위기 + 과각질 패턴]")
    inp1 = DiagnosisInput(
        checked_symptoms=[
            "C8_03", "C8_01", "C4_14", "C8_15",  # Barrier Triad
            "C8_12", "C8_06", "C4_04", "C4_05",  # Over-Exfoliation
            "C3_01", "C3_02", "C4_01", "C4_03",
            "C8_08", "C8_09", "C3_10"
        ],
        contexts=["recent_procedure"],
        skin_type="sensitive",
        tier="Full"
    )
    r1 = run_diagnosis(inp1)

    print(f"\n⚡ Urgency: {r1.urgency_level}")
    print(f"🔴 Primary: {r1.primary_concerns}")
    print(f"🟡 Secondary: {r1.secondary_concerns}")
    print(f"\n🔍 Detected Patterns ({len(r1.detected_patterns)}):")
    for p in r1.detected_patterns:
        print(f"  [{p.urgency}] {p.name_en} → {p.recommendation_flag}")
    print(f"\n🏷️ Active Flags: {r1.active_flags}")
    print("\n📦 Product Bundle:")
    for phase, products in r1.product_bundle.items():
        if products:
            print(f"  {phase}:")
            for p in products:
                print(f"    → {p['name']} (€{p['price_eur']}) handle: {p['shopify_handle']}")

    plot_clinical_dashboard(r1, "Skin Strategy Lab — Case1: 장벽 위기",
                            save_path="/home/claude/v3_case1_dashboard.png")

    # ─── Test Case 2: 광노화 + 노화 가속 패턴 ─────────────────────
    print("\n[TEST v3 — Case 2: 광노화 + 안티에이징]")
    inp2 = DiagnosisInput(
        checked_symptoms=[
            "C5_06", "C5_13", "C5_02", "C5_15",  # Photo-Aging
            "C7_06", "C7_11", "C7_03", "C7_07", "C7_12",  # Aging Triad
            "C3_01", "C3_06", "C7_10", "C5_05"
        ],
        contexts=["outdoor_work"],
        skin_type="dry",
        tier="Premium"
    )
    r2 = run_diagnosis(inp2)

    print(f"\n⚡ Urgency: {r2.urgency_level}")
    print(f"🔴 Primary: {r2.primary_concerns}")
    print(f"\n🔍 Detected Patterns:")
    for p in r2.detected_patterns:
        print(f"  [{p.urgency}] {p.name_en} → {p.recommendation_flag}")

    print("\n📦 Product Bundle (Premium Tier):")
    for phase, products in r2.product_bundle.items():
        if products:
            print(f"  {phase}:")
            for p in products:
                print(f"    → {p['name']} (€{p['price_eur']}) — {p['shopify_handle']}")

    plot_clinical_dashboard(r2, "Skin Strategy Lab — Case2: 광노화 안티에이징",
                            save_path="/home/claude/v3_case2_dashboard.png")

    # JSON Export 테스트
    json_output = export_result_json(r2, inp2)
    with open("/home/claude/result_export.json", "w", encoding="utf-8") as f:
        f.write(json_output)
    print("\n✅ JSON export 완료: result_export.json")

    print("\n✅ Score Engine v3 실행 완료")
