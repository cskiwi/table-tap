import { gql } from 'apollo-angular';

export const GET_CAFE_MENU = gql`
  query GetCafeMenu(
    $cafeId: String!
    $categoryId: String
    $pagination: PaginationInput
    $sort: SortInput
  ) {
    cafeMenu(
      cafeId: $cafeId
      categoryId: $categoryId
      pagination: $pagination
      sort: $sort
    ) {
      items {
        id
        name
        description
        price
        status
        preparationTime
        imageUrl
        nutritionalInfo
        allergens
        sortOrder
        cafeId
        categoryId
        category {
          id
          name
          description
          imageUrl
          sortOrder
          isActive
        }
      }
      total
      page
      limit
      hasMore
    }
  }
`;

export const GET_MENU_CATEGORIES = gql`
  query GetMenuCategories($cafeId: String!, $activeOnly: Boolean = true) {
    menuCategories(cafeId: $cafeId, activeOnly: $activeOnly) {
      id
      name
      description
      category
      basePrice
      finalPrice
      image
      isAvailable
      isFeatured
      sortOrder
      cafeId
    }
  }
`;

export const GET_AVAILABLE_MENU_ITEMS = gql`
  query GetAvailableMenuItems($cafeId: String!, $categoryId: String) {
    availableMenuItems(cafeId: $cafeId, categoryId: $categoryId) {
      id
      name
      description
      price
      status
      preparationTime
      imageUrl
      nutritionalInfo
      allergens
      sortOrder
      cafeId
      categoryId
      category {
        id
        name
        description
        imageUrl
        sortOrder
        isActive
      }
    }
  }
`;

export const GET_MENU_ITEM = gql`
  query GetMenuItem($id: String!) {
    menuItem(id: $id) {
      id
      name
      description
      price
      status
      preparationTime
      imageUrl
      nutritionalInfo
      allergens
      sortOrder
      cafeId
      categoryId
      category {
        id
        name
        description
        imageUrl
        sortOrder
        isActive
      }
      cafe {
        id
        name
        description
      }
    }
  }
`;

export const SEARCH_MENU_ITEMS = gql`
  query SearchMenuItems(
    $cafeId: String!
    $query: String!
    $pagination: PaginationInput
  ) {
    searchMenuItems(cafeId: $cafeId, query: $query, pagination: $pagination) {
      id
      name
      description
      price
      status
      preparationTime
      imageUrl
      nutritionalInfo
      allergens
      sortOrder
      cafeId
      categoryId
      category {
        id
        name
        description
        imageUrl
        sortOrder
        isActive
      }
    }
  }
`;

export const GET_MENU_WITH_CATEGORIES = gql`
  query GetMenuWithCategories($cafeId: String!) {
    menuCategories(cafeId: $cafeId, activeOnly: true) {
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
    }
  }
`;