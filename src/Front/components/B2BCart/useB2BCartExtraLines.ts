import { useB2BDemoCart } from '../Search/b2bDemoCart';

export const useHasB2BCartExtraLines = (): boolean => useB2BDemoCart().inCart;

export default useHasB2BCartExtraLines;
