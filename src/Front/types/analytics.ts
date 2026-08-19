export interface TrackingItem {
  item_id: string;
  item_name: string;
  index: number;
  product_type?: string;
  product_division?: string;
  product_format?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_brand?: string;
  price?: number | null;
  discount?: number | null;
}
