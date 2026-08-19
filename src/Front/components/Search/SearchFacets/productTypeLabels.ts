/**
 * MAP-1 (first pass): friendly display labels for the B2B PLP's `productType` facet values.
 *
 * The Algolia product index stores raw `productType` values (e.g. `training-online-self-paced`);
 * this maps them to human-readable labels for the filter UI ONLY — the underlying refinement
 * value sent to Algolia is unchanged. Applied solely to the `productType` facet (B2B PLP), so
 * no other facet/page is affected.
 *
 * This is an interim code map. Per MAP-1/SITE-5, the Business-owned `productTypes → category`
 * mapping (and the design's category grouping: Training / Kits / Exams / AMF) should eventually
 * live in Sitecore data. Unknown values fall back to the raw value (SAFE-1).
 */
export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  certification: 'Certification',
  certificate: 'Certificate',
  courses: 'Courses',
  'skill-builder': 'Skill Builder',
  'training-online-self-paced': 'Online: Self-Paced Training',
  'training-online-instructor': 'Online: Instructor-Led Training',
  // Commerce variant index (-b2b) productType values (MAP-1 friendly labels).
  'pt-course': 'Course',
  'pt-express-course': 'Express Course',
  'pt-exam-prep': 'Exam Prep',
  'pt-exams': 'Exam',
  'pt-amf': 'AMF & Dues',
  'product-bundle': 'Bundle',
};

const PRODUCT_TYPE_LABEL_LOOKUP = new Map(Object.entries(PRODUCT_TYPE_LABELS));

/** Friendly label for a raw `productType` value, falling back to the raw value (SAFE-1). */
export const getProductTypeLabel = (value: string, fallback: string): string =>
  PRODUCT_TYPE_LABEL_LOOKUP.get(value) ?? fallback;

/** The attribute whose values get the friendly-label treatment (the B2B PLP category facet). */
export const PRODUCT_TYPE_ATTRIBUTE = 'productType';
