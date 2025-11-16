import { gql } from 'apollo-angular';

// Product fragment for reuse
const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    id
    name
    description
    category
    basePrice
    finalPrice
    discountPrice
    image
    isAvailable
    isFeatured
    sortOrder
    preparationTime
    tags
    cafeId
    status
    cafe {
      id
      name
      description
    }
  }
`;

// Dynamic query using ProductArgs
export const GET_PRODUCTS = gql`
  ${PRODUCT_FIELDS}
  query GetProducts($args: ProductArgs) {
    products(args: $args) {
      ...ProductFields
    }
  }
`;

// Single product query (kept for backwards compatibility)
export const GET_PRODUCT = gql`
  ${PRODUCT_FIELDS}
  query GetProduct($id: String!) {
    product(id: $id) {
      ...ProductFields
    }
  }
`;

// Legacy query names for backwards compatibility
export const GET_CAFE_MENU = GET_PRODUCTS;
export const GET_AVAILABLE_MENU_ITEMS = GET_PRODUCTS;
export const GET_MENU_ITEM = GET_PRODUCT;
export const SEARCH_MENU_ITEMS = GET_PRODUCTS;
export const GET_MENU_WITH_CATEGORIES = GET_PRODUCTS;3