import { gql } from 'apollo-angular';

/**
 * Query to fetch cafe information by hostname.
 * Used for hostname-based cafe detection.
 */
export const GET_CAFE_BY_HOSTNAME = gql`
  query GetCafeByHostname($hostname: String!) {
    cafeByHostname(hostname: $hostname) {
      id
      name
      description
      slug
      logo
      website
      isActive
      status
      address
      city
      country
      zipCode
      email
      phone
    }
  }
`;

/**
 * Query to fetch full cafe details including hostnames.
 */
export const GET_CAFE_DETAILS = gql`
  query GetCafeDetails($id: String!) {
    cafe(id: $id) {
      id
      name
      description
      slug
      logo
      website
      isActive
      status
      address
      city
      country
      zipCode
      email
      phone
    }
  }
`;
