export default interface IBusinessUnitProductData {
  productId: string;
  stock: number;
  maximumStock: number;
  minimumStock: number;
  maximumDiscountPercentage: number;
  maximumDiscountValue: number;
  price: number;
  costPrice: number;
  profitMargin: number;
}
