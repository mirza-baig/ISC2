import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { QuoteDocumentData, QuoteDocumentLabels } from 'types/index';
import { QUOTE_DOCUMENT_DEFAULT_LABELS } from 'constants/index';

import { Isc2LogoPdf } from './Isc2LogoPdf';
const DISCLAIMER_LINK_URL = 'https://www.isc2.org/policies-procedures/terms-conditions';

const COLORS = {
  green: '#468145',
  ink: '#000000',
  body: '#33333A',
  muted: '#575C61',
  rule: '#D5D7D9',
} as const;

const LOGO_WIDTH = 100;

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 44,
    paddingBottom: 64,
    fontSize: 9,
    color: COLORS.body,
    lineHeight: 1.5,
  },

  header: { flexDirection: 'row', alignItems: 'center' },
  headerSpacer: { width: LOGO_WIDTH },
  titleBlock: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, color: COLORS.ink, textAlign: 'center' },
  titleRule: { width: 160, height: 2, backgroundColor: COLORS.green, marginTop: 6 },

  disclaimer: {
    marginTop: 24,
    padding: 8,
    backgroundColor: '#F4F6F4',
    borderLeftWidth: 2,
    borderLeftColor: COLORS.green,
    fontSize: 7.5,
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
  /** Standalone lines in Bill To / Ship To: no label/value split, just stacked text. */
  addressOrganization: { color: COLORS.ink, marginBottom: 1 },

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
  colQty: { width: 30, textAlign: 'center' },
  colMoney: { width: 62, textAlign: 'right' },
  colMoneyWide: { width: 84, textAlign: 'right' },
  productName: { fontSize: 9, color: COLORS.ink },
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

type MetaCellProps = { label: string; value?: string };

const MetaCell = ({ label, value }: MetaCellProps) =>
  value ? (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  ) : null;

export type QuoteDocumentProps = {
  data: QuoteDocumentData;
  labels?: QuoteDocumentLabels;
};

/**
 * The eCommerce quote PDF, generated client-side from the live cart at checkout's
 * Payment Information step. Replaces the Salesforce CPQ quote look for the eCommerce
 * flow — no quote number, no expiration date (MVP carts are real-time), no "group"
 * labels; totals read Quote Subtotal / Tax Total / Quote Total, all amounts carry an
 * explicit currency-code prefix (e.g. "USD 762.38").
 *
 * Pure presentation: every value arrives already formatted from `buildQuoteData`, so
 * this renders the same way from checkout or a test.
 */
export const QuoteDocument = ({ data, labels }: QuoteDocumentProps) => {
  const label = <TKey extends keyof typeof QUOTE_DOCUMENT_DEFAULT_LABELS>(key: TKey): string =>
    labels?.[key as keyof QuoteDocumentLabels] || QUOTE_DOCUMENT_DEFAULT_LABELS[key];

  return (
    <Document title={label('documentTitle')} author="ISC2" subject={label('documentTitle')}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Isc2LogoPdf width={LOGO_WIDTH} />
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{label('documentTitle')}</Text>
            <View style={styles.titleRule} />
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.metaRow}>
          <MetaCell label={label('createdDateLabel')} value={data.createdDate} />
          <MetaCell label={label('buyerNameLabel')} value={data.buyerName} />
          <MetaCell label="Currency" value={data.currencyCode} />
        </View>

        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.sectionHeading}>{label('billToLabel')}</Text>
            {Boolean(data.organizationName) && (
              <Text style={styles.addressOrganization}>{data.organizationName}</Text>
            )}
            {Boolean(data.buyerName) && <Text>{data.buyerName}</Text>}
            {data.billingAddressLines.map((line) => (
              <Text key={line}>{line}</Text>
            ))}
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionHeading}>{label('shipToLabel')}</Text>
            {Boolean(data.buyerName) && <Text>{data.buyerName}</Text>}
            {data.shippingAddressLines.map((line) => (
              <Text key={line}>{line}</Text>
            ))}
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
            <Text style={[styles.headCell, styles.colMoney]}>{label('taxColumnLabel')}</Text>
            <Text style={[styles.headCell, styles.colMoneyWide]}>
              {label('subtotalColumnLabel')}
            </Text>
          </View>

          {data.lineItems.map((lineItem, index) => (
            <View key={`${lineItem.name}-${index}`} style={styles.tableRow} wrap={false}>
              <Text style={[styles.productName, styles.colProduct]}>{lineItem.name}</Text>
              <Text style={styles.colQty}>{lineItem.quantity}</Text>
              <Text style={[styles.colMoney, ...(lineItem.hasDiscount ? [styles.strike] : [])]}>
                {lineItem.listPrice}
              </Text>
              <Text style={styles.colMoney}>{lineItem.discountedPrice}</Text>
              <Text style={styles.colMoney}>{lineItem.tax}</Text>
              <Text style={styles.colMoneyWide}>{lineItem.subtotal}</Text>
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
        </View>

        {Boolean(label('disclaimerText')) && (
          <Link src={DISCLAIMER_LINK_URL} style={styles.disclaimer}>
            {label('disclaimerText')}
          </Link>
        )}

        <View style={styles.footer} fixed>
          <Text>{label('footerNote')}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
