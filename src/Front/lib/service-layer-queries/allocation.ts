// Validate inventory and accept allocation for OIL products
export const ACCEPT_OIL_ALLOCATION = `
  mutation SalesforceCreateAllocation($input: SalesforceAllocation) {
    salesforceCreateAllocation(input: $input) {
      success
    }
}
`;
