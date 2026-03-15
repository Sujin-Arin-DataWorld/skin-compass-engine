import { RequiredIngredient } from '../types';

type AxisMap = Record<string, Record<string, RequiredIngredient[]>>;

export const AXIS_INGREDIENT_MAP: AxisMap = {
  sebum: {
    extreme: [
      { name_en: 'Salicylic Acid (BHA)', name_kr: '살리실산(BHA)', min_concentration: 2.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Niacinamide', name_kr: '나이아신아마이드', min_concentration: 10.0, max_concentration: 20.0, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Zinc PCA', name_kr: '아연(Zinc PCA)', min_concentration: 1.0, max_concentration: 4.0, unit: '%', priority: 'must_have', contraindicated_with: [] },
    ],
    severe: [
      { name_en: 'Salicylic Acid (BHA)', name_kr: '살리실산(BHA)', min_concentration: 2.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Niacinamide', name_kr: '나이아신아마이드', min_concentration: 5.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
    ],
    moderate: [
      { name_en: 'Salicylic Acid (BHA)', name_kr: '살리실산(BHA)', min_concentration: 0.5, max_concentration: 2.0, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
      { name_en: 'Niacinamide', name_kr: '나이아신아마이드', min_concentration: 2.0, max_concentration: 5.0, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
  },
  hydration: {
    extreme: [
      { name_en: 'Hyaluronic Acid (multi-weight)', name_kr: '다중 히알루론산', min_concentration: null, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Panthenol', name_kr: '판테놀', min_concentration: 5.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Ectoin', name_kr: '엑토인', min_concentration: null, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
    severe: [
      { name_en: 'Hyaluronic Acid', name_kr: '히알루론산', min_concentration: null, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Panthenol', name_kr: '판테놀', min_concentration: null, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
    moderate: [
      { name_en: 'Glycerin', name_kr: '글리세린', min_concentration: null, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
  },
  pores: {
    extreme: [
      { name_en: 'Salicylic Acid (BHA)', name_kr: '살리실산(BHA)', min_concentration: 2.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Niacinamide', name_kr: '나이아신아마이드', min_concentration: 10.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
    ],
    severe: [
      { name_en: 'Salicylic Acid (BHA)', name_kr: '살리실산(BHA)', min_concentration: 0.5, max_concentration: 2.0, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Niacinamide', name_kr: '나이아신아마이드', min_concentration: 5.0, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
  },
  sensitivity: {
    extreme: [
      { name_en: 'HOLD_ALL_ACTIVES', name_kr: '모든 활성 성분 중단', min_concentration: null, max_concentration: null, unit: '', priority: 'must_have', contraindicated_with: ['Salicylic Acid', 'L-Ascorbic Acid', 'Retinol', 'AHA', 'Azelaic Acid'] },
      { name_en: 'Centella Asiatica Extract', name_kr: '병풀추출물', min_concentration: 60.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Ceramide NP', name_kr: '세라마이드', min_concentration: null, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
    ],
    severe: [
      { name_en: 'Centella Asiatica Extract', name_kr: '병풀추출물', min_concentration: 40.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Madecassoside', name_kr: '마데카소사이드', min_concentration: null, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Panthenol', name_kr: '판테놀', min_concentration: null, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
    moderate: [
      { name_en: 'Allantoin', name_kr: '알란토인', min_concentration: null, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
  },
  barrier: {
    extreme: [
      { name_en: 'HOLD_ALL_ACTIVES', name_kr: '모든 활성 성분 중단', min_concentration: null, max_concentration: null, unit: '', priority: 'must_have', contraindicated_with: ['Salicylic Acid', 'L-Ascorbic Acid', 'Retinol', 'AHA'] },
      { name_en: 'Ceramide NP', name_kr: '세라마이드', min_concentration: 2.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Cholesterol', name_kr: '콜레스테롤', min_concentration: 4.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Fatty Acids', name_kr: '지방산', min_concentration: 2.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
    ],
    severe: [
      { name_en: 'Ceramide NP', name_kr: '세라마이드', min_concentration: null, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Squalane', name_kr: '스쿠알란', min_concentration: null, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
  },
  pigmentation: {
    extreme: [
      { name_en: 'Tranexamic Acid', name_kr: '트라넥삼산', min_concentration: 5.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Niacinamide', name_kr: '나이아신아마이드', min_concentration: 15.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Alpha-Arbutin', name_kr: '알파알부틴', min_concentration: 2.0, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
    severe: [
      { name_en: 'Azelaic Acid', name_kr: '아젤라산', min_concentration: 15.0, max_concentration: 20.0, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Niacinamide', name_kr: '나이아신아마이드', min_concentration: 5.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
    ],
    moderate: [
      { name_en: 'L-Ascorbic Acid', name_kr: '순수 비타민C', min_concentration: 15.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: ['Retinol'] },
      { name_en: 'Niacinamide', name_kr: '나이아신아마이드', min_concentration: 5.0, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
  },
  aging: {
    extreme: [
      { name_en: 'L-Ascorbic Acid', name_kr: '순수 비타민C', min_concentration: 15.0, max_concentration: 20.0, unit: '%', priority: 'must_have', contraindicated_with: ['Retinol'] },
      { name_en: 'Retinol', name_kr: '레티놀', min_concentration: 0.3, max_concentration: 0.5, unit: '%', priority: 'must_have', contraindicated_with: ['L-Ascorbic Acid', 'Salicylic Acid'] },
      { name_en: 'Peptides', name_kr: '펩타이드', min_concentration: null, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: [] },
      { name_en: 'Ferulic Acid', name_kr: '페룰산', min_concentration: null, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
    severe: [
      { name_en: 'L-Ascorbic Acid', name_kr: '순수 비타민C', min_concentration: 15.0, max_concentration: null, unit: '%', priority: 'must_have', contraindicated_with: ['Retinol'] },
      { name_en: 'Retinol', name_kr: '레티놀', min_concentration: 0.1, max_concentration: 0.3, unit: '%', priority: 'nice_to_have', contraindicated_with: ['L-Ascorbic Acid'] },
    ],
    moderate: [
      { name_en: 'Adenosine', name_kr: '아데노신', min_concentration: null, max_concentration: null, unit: '%', priority: 'nice_to_have', contraindicated_with: [] },
    ],
  },
};
