import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { BusinessReceiptData, BusinessReceiptLabels } from 'types/index';
import { BUSINESS_RECEIPT_DEFAULT_LABELS } from 'constants/index';

import { BusinessReceiptLogo } from './BusinessReceiptLogo';

const COLORS = {
  green: '#468145',
  ink: '#000000',
  body: '#33333A',
  muted: '#575C61',
  rule: '#D5D7D9',
  band: '#F4F6F4',
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 44,
    paddingBottom: 64,
    fontSize: 9,
    color: COLORS.body,
    lineHeight: 1.5,
  },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock: { alignItems: 'flex-end' },
  title: { fontSize: 20, color: COLORS.ink },
  /** Spans the title because the block shrinks to its content. */
  titleRule: { width: '100%', height: 2, backgroundColor: COLORS.green, marginTop: 6 },

  disclaimer: {
    marginTop: 18,
    padding: 8,
    backgroundColor: COLORS.band,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.green,
    fontSize: 8,
    color: COLORS.muted,
  },

  metaRow: { flexDirection: 'row', marginTop: 18 },
  metaCell: { flex: 1, paddingRight: 12 },
  metaLabel: { fontSize: 7, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  metaValue: { fontSize: 10, color: COLORS.ink },

  columns: { flexDirection: 'row', marginTop: 20 },
  column: { flex: 1, paddingRight: 16 },
  sectionHeading: {
    fontSize: 8,
    color: COLORS.green,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingBottom: 4,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
  },
  detailRow: { flexDirection: 'row', marginBottom: 2 },
  detailLabel: { width: 104, color: COLORS.muted },
  detailValue: { flex: 1, color: COLORS.ink },
  /** Standalone lines in Bill To: `detailValue` carries flex:1 and collapses here. */
  billToOrganization: { color: COLORS.ink, marginBottom: 1 },

  table: { marginTop: 22 },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
    paddingBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
  },
  headCell: { fontSize: 7, color: COLORS.ink, textTransform: 'uppercase', letterSpacing: 0.6 },
  colProduct: { flex: 3 },
  colQty: { width: 34, textAlign: 'center' },
  colMoney: { width: 66, textAlign: 'right' },
  productName: { fontSize: 9, color: COLORS.ink },
  productLocation: { fontSize: 7.5, color: COLORS.muted },
  strike: { textDecoration: 'line-through', color: COLORS.muted },

  totals: { marginTop: 14, marginLeft: 'auto', width: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.ink,
  },
  grandTotalValue: { fontSize: 13, color: COLORS.green },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
  },

  footer: {
    position: 'absolute',
    bottom: 28,
    left: 44,
    right: 44,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.rule,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: COLORS.muted,
  },
});

type DetailRowProps = { label: string; value?: string };

/** Placeholder for a field with no data source yet — keeps the row visible instead of
 * silently vanishing, so a reviewer sees what's missing rather than an inconsistent layout. */
const NO_VALUE = '—';

/** Always renders — the row stays visible with a placeholder when the value is absent. */
const DetailRow = ({ label, value }: DetailRowProps) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || NO_VALUE}</Text>
  </View>
);

const MetaCell = ({ label, value }: DetailRowProps) => (
  <View style={styles.metaCell}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value || NO_VALUE}</Text>
  </View>
);

export type BusinessTransactionReceiptProps = {
  data: BusinessReceiptData;
  labels?: BusinessReceiptLabels;
};

/**
 * The business transaction receipt PDF.
 *
 * Pure presentation: every value arrives already formatted from
 * `buildBusinessReceiptData`, so this renders the same way from the confirmation screen,
 * order history, or a test.
 */
export const BusinessTransactionReceipt = ({ data, labels }: BusinessTransactionReceiptProps) => {
  const label = <TKey extends keyof typeof BUSINESS_RECEIPT_DEFAULT_LABELS>(key: TKey): string =>
    labels?.[key as keyof BusinessReceiptLabels] || BUSINESS_RECEIPT_DEFAULT_LABELS[key];

  const showLocationColumn = data.lineItems.some((lineItem) => lineItem.location);

  return (
    <Document
      title={`${label('documentTitle')} ${data.orderNumber}`}
      author="ISC2"
      subject={label('documentTitle')}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <BusinessReceiptLogo width={96} />
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{label('documentTitle')}</Text>
            <View style={styles.titleRule} />
          </View>
        </View>

        <Text style={styles.disclaimer}>{label('disclaimer')}</Text>

        <View style={styles.metaRow}>
          <MetaCell label={label('orderNumberLabel')} value={data.orderNumber} />
          <MetaCell label={label('orderDateLabel')} value={data.orderDate} />
          <MetaCell label={label('orderStatusLabel')} value={data.orderStatus} />
          <MetaCell label={label('currencyLabel')} value={data.currencyCode} />
        </View>

        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.sectionHeading}>{label('billToLabel')}</Text>
            <Text style={styles.billToOrganization}>{data.organizationName || NO_VALUE}</Text>
            <Text>{data.buyerName || NO_VALUE}</Text>
            {data.billingAddressLines.length > 0 ? (
              data.billingAddressLines.map((line) => <Text key={line}>{line}</Text>)
            ) : (
              <Text>{NO_VALUE}</Text>
            )}
            <Text>{data.buyerEmail || NO_VALUE}</Text>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionHeading}>{label('purchaseDetailsLabel')}</Text>
            <DetailRow label={label('isc2EntityLabel')} value={data.isc2EntityName} />
            <DetailRow label={label('poNumberLabel')} value={data.poNumber} />
            <DetailRow
              label={label('customerOrderReferenceLabel')}
              value={data.customerOrderReference}
            />
            <DetailRow label={label('taxIdLabel')} value={data.taxIdNumber} />
            <DetailRow label={label('intacctCustomerIdLabel')} value={data.intacctCustomerId} />
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHead} fixed>
            <Text style={[styles.headCell, styles.colProduct]}>{label('productColumnLabel')}</Text>
            <Text style={[styles.headCell, styles.colQty]}>{label('quantityColumnLabel')}</Text>
            <Text style={[styles.headCell, styles.colMoney]}>{label('listPriceColumnLabel')}</Text>
            <Text style={[styles.headCell, styles.colMoney]}>
              {label('discountedPriceColumnLabel')}
            </Text>
            <Text style={[styles.headCell, styles.colMoney]}>{label('subtotalColumnLabel')}</Text>
          </View>

          {data.lineItems.map((lineItem, index) => (
            <View key={`${lineItem.name}-${index}`} style={styles.tableRow} wrap={false}>
              <View style={styles.colProduct}>
                <Text style={styles.productName}>{lineItem.name}</Text>
                {showLocationColumn && Boolean(lineItem.location) && (
                  <Text style={styles.productLocation}>
                    {label('locationColumnLabel')}: {lineItem.location}
                  </Text>
                )}
              </View>
              <Text style={styles.colQty}>{lineItem.quantity}</Text>
              <Text style={[styles.colMoney, ...(lineItem.discountedPrice ? [styles.strike] : [])]}>
                {lineItem.listPrice}
              </Text>
              <Text style={styles.colMoney}>{lineItem.discountedPrice || NO_VALUE}</Text>
              <Text style={styles.colMoney}>{lineItem.subtotal}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>{label('subtotalLabel')}</Text>
            <Text>{data.subtotal}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>{label('taxLabel')}</Text>
            <Text>{data.tax}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={{ fontSize: 13, color: COLORS.ink }}>{label('totalLabel')}</Text>
            <Text style={styles.grandTotalValue}>{data.total}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={{ color: COLORS.muted }}>{label('paymentMethodLabel')}</Text>
            <Text style={{ color: COLORS.ink }}>{data.paymentMethod || NO_VALUE}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>{label('footerNote')}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
