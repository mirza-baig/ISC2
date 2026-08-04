const jssConfig = require('./src/temp/config');
const plugins = require('./src/temp/next-config-plugins') || {};

const publicUrl = jssConfig.publicUrl;

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  transpilePackages: ['@algolia/autocomplete-shared'],

  // Set assetPrefix to our public URL
  assetPrefix: process.env.NODE_ENV === 'development' ? '' : publicUrl,

  // Allow specifying a distinct distDir when concurrently running app in a container
  distDir: process.env.NEXTJS_DIST_DIR || '.next',

  // Make the same PUBLIC_URL available as an environment variable on the client bundle
  env: {
    REAL_PUBLIC_URL: process.env.PUBLIC_URL,
    PUBLIC_URL: publicUrl,
  },

  i18n: {
    // These are all the locales you want to support in your application.
    // These should generally match (or at least be a subset of) those in Sitecore.
    locales: ['en'],
    // This is the locale that will be used when visiting a non-locale
    // prefixed path e.g. `/styleguide`.
    defaultLocale: jssConfig.defaultLanguage,
  },

  // Enable React Strict Mode
  reactStrictMode: true,

  // use this configuration to ensure that only images from the whitelisted domains
  // can be served from the Next.js Image Optimization API
  // see https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
  images: {
    unoptimized: true, // managed by XMC with parameters. https://github.com/vercel/next.js/discussions/53041
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'edge*.**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '*.localhost',
        port: '',
      },
      {
        protocol: 'http',
        hostname: '*.localhost',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'xmc-*.**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'feaas*.blob.core.windows.net',
        port: '',
      },
    ],
  },

  async redirects() {
    const isPreview = process.env.APPLICATION_ENV === 'preview';

    const mediaRedirects = [
      {
        source: '/-/media/:slug*',
        destination: `${process.env.SITECORE_MEDIA_HOST}/-/media/:slug*`,
        permanent: true,
      },
      {
        source: '/-/jssmedia/:slug*',
        destination: `${process.env.SITECORE_MEDIA_HOST}/-/media/:slug*`,
        permanent: true,
      },
    ];

    const baseRedirects = [
      {
        source: '/cybersecurity-advocates',
        destination: '/about/advocacy',
        permanent: true,
      },
      {
        source: '/cloud-security',
        destination: '/landing/cloud-security',
        permanent: true,
      },
      {
        source: '/1mcc',
        destination: '/landing/1mcc',
        permanent: true,
      },
      {
        source: '/events',
        destination: '/professional-development/events',
        permanent: true,
      },
      {
        source: '/news-and-events/webinars/from-the-trenches',
        destination: '/professional-development/webinars',
        permanent: true,
      },
      {
        source: '/news-and-events/webinars/emea-webinars/:slug',
        destination: '/professional-development/webinars/emea-webinars',
        permanent: true,
      },
      {
        source: '/training/cloud-security-team-development',
        destination: '/thank-you/cloud-security-team-development',
        permanent: true,
      },
      {
        source: '/training/courses',
        destination: '/training',
        permanent: true,
      },
      {
        source: '/training/secure-software-practitioner-suites',
        destination: 'https://www.securitycompass.com/application-security-training',
        permanent: true,
      },
      {
        source: '/cybersecurity-leadership',
        destination: '/landing/cybersecurity-leadership',
        permanent: true,
      },
      {
        source: '/software-security',
        destination: '/landing/software-security',
        permanent: true,
      },
      {
        source: '/security-operations',
        destination: '/landing/security-operations',
        permanent: true,
      },
      {
        source: '/network-security',
        destination: '/landing/network-security',
        permanent: true,
      },
      {
        source: '/governance-risk-compliance',
        destination: '/landing/governance-risk-compliance',
        permanent: true,
      },
      {
        source: '/entry-level-cybersecurity',
        destination: '/landing/entry-level-cybersecurity',
        permanent: true,
      },
      {
        source: '/certifications/ccsp/domain-refresh-faq',
        destination: '/certifications/ccsp',
        permanent: true,
      },
      {
        source: '/certifications/cissp/domain-refresh-faq',
        destination: '/certifications/cissp',
        permanent: true,
      },
      {
        source: '/certifications/cissp-concentrations/issap-domain-change-faqs',
        destination: '/certifications/cissp-issap',
        permanent: true,
      },
      {
        source: '/certifications/cissp-concentrations/issep-domain-change-faqs',
        destination: '/certifications/cissp-issep',
        permanent: true,
      },
      {
        source: '/certifications/sscp/domain-change-faq',
        destination: '/certifications/sscp',
        permanent: true,
      },
      {
        source: '/landing/20offtraining',
        destination: '/training',
        permanent: true,
      },
      {
        source: '/landing/free-exam-retake',
        destination: '/landing/exam-peace-of-mind',
        permanent: true,
      },
      {
        source: '/professional-development/events/secure-london',
        destination: 'https://web.cvent.com/event/db1fff22-c315-4724-8f90-cebb4d41c926/summary',
        permanent: true,
      },
      {
        source: '/professional-development/events/spotlight-secure-software-development',
        destination: 'https://cvent.me/On0rYg?RefId=Home',
        permanent: true,
      },
      {
        source: '/professional-development/events/secure-washington-dc',
        destination: 'https://cvent.me/9OnZyP',
        permanent: true,
      },
      {
        source: '/professional-development/events/secure-asia-pacific',
        destination: 'https://cvent.me/LQ7MLB',
        permanent: true,
      },
      {
        source: '/member-verification',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/MemberVerification`,
        permanent: true,
      },
      {
        source: '/professional-development/events/spotlight-modernizing-security-operations',
        destination: 'https://cvent.me/xyLoMZ?RefId=Home',
        permanent: true,
      },
      //#region Sitecore V10 redirects
      {
        source: '/certifications/hcispp/hcispp-self-study-resources/:slug(chapter\\-\\d{1,7})',
        destination: '/professional-development/certificates/healthcare-certificates-program',
        permanent: true,
      },
      {
        source: '/certifications/hcispp/hcispp-self-study-resources',
        destination: '/professional-development/certificates/healthcare-certificates-program',
        permanent: true,
      },
      {
        source: '/thank-you/cert-prep-kit',
        destination: '/thank-you/commit',
        permanent: true,
      },
      {
        source: '/landing/free-exam-retake',
        destination: '/landing/exam-peace-of-mind',
        permanent: true,
      },
      {
        source: '/thank-you/cpe-guide',
        destination: '/professional-development',
        permanent: true,
      },
      {
        source: '/thank-you/cyber-career-starter ',
        destination: '/Certifications/cc',
        permanent: true,
      },
      {
        source: '/thank-you/enterprise-training-webinar',
        destination: '/thank-you/enterprise-ebook',
        permanent: true,
      },
      {
        source: '/training/secure-software-practitioner-suites',
        destination: 'https://www.securitycompass.com/application-security-training',
        permanent: true,
      },
      {
        source:
          '/professional-development/webinars/emea-webinars/:path(emea-live|esummits|focused-webinars)',
        destination: '/professional-development/webinars/emea-webinars',
        permanent: true,
      },
      {
        source: '/professional-development/webinars/from-the-trenches',
        destination: '/professional-development/webinars',
        permanent: true,
      },
      {
        source: '/members/member-benefits',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/Member-Resources/Exclusive-Benefits`,
        permanent: true,
      },
      {
        source: '/amfs-overview',
        destination: '/policies-procedures/amfs-overview',
        permanent: true,
      },
      {
        source: '/policies-procedures/amfs-overview-change-:path(cn|jp|kr)',
        destination: '/Policies-Procedures/AMFs-Overview',
        permanent: true,
      },
      //#endregion
      //#region Sitecore V8 old redirects
      {
        source: '/Landing/100K-inthe-UK',
        destination: '/landing/1mcc',
        permanent: true,
      },
      {
        source: '/1MCC',
        destination: '/landing/1mcc',
        permanent: true,
      },
      {
        source: '/20offosp',
        destination: '/landing/20offosp',
        permanent: true,
      },
      {
        source: '/Landing/20offTraining',
        destination: '/training',
        permanent: true,
      },
      {
        source: '/40off-bundle',
        destination: '/training/online-instructor-led',
        permanent: true,
      },
      {
        source: '/aisla',
        destination: '/about/award-programs',
        permanent: true,
      },
      {
        source:
          '/-/media/ISC2/Training/Enterprise Solutions/Enterprise-Catalogs_EnterpriseSolutionsCatalog-APAC-A4-Digital',
        destination: '/training/enterprise-solutions',
        permanent: true,
      },
      {
        source: '/CC-bundles',
        destination: '/landing/cc-bundles',
        permanent: true,
      },
      {
        source: '/ccsp-evolved',
        destination: '/landing/ccsp-evolved',
        permanent: true,
      },
      {
        source: '/CCSP-Exam-Outline',
        destination: '/certifications/ccsp/ccsp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/CCSP-Product-Sheet',
        destination: 'https://cloud.connect.isc2.org/ccsp-webcast-series',
        permanent: true,
      },
      {
        source:
          '/sitecore/media library/ISC2/Certifications/Product Sheets/CCSP-DIGITAL-UNPUBLISHED',
        destination: 'https://cloud.connect.isc2.org/ccsp-webcast-series',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Product Sheets/CCSP-DIGITAL-UNPUBLISHED',
        destination: 'https://cloud.connect.isc2.org/ccsp-webcast-series',
        permanent: true,
      },
      {
        source: '/CCSP-Ultimate-Guide',
        destination: 'https://cloud.connect.isc2.org/ccsp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideCCSP-2018',
        destination: 'https://cloud.connect.isc2.org/ccsp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/CCSP-Webcast',
        destination: 'https://cloud.connect.isc2.org/ccsp-webcast-series',
        permanent: true,
      },
      {
        source: '/CC-Ultimate-Guide',
        destination: 'https://cloud.connect.isc2.org/cc-ultimate-guide',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideCC-Web',
        destination: 'https://cloud.connect.isc2.org/cc-ultimate-guide',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideCGRC-Web',
        destination: 'https://cloud.connect.isc2.org/cgrc-ultimate-guide',
        permanent: true,
      },
      {
        source: '/CISSP20off',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/CISSP-Exam-Outline',
        destination: '/certifications/cissp/cissp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP',
        destination: 'https://cloud.connect.isc2.org/cissp-flashcards',
        permanent: true,
      },
      {
        source: '/cissp-interview-blogs',
        destination: '/landing/cissp-interview-blogs',
        permanent: true,
      },
      {
        source: '/Landing/Interview',
        destination: '/landing/cissp-interview-blogs',
        permanent: true,
      },
      {
        source: '/cissp-preview',
        destination: '/training/online-self-paced/cissp-online-self-paced',
        permanent: true,
      },
      {
        source: '/Training/Courses/CISSP-Training-Course',
        destination: '/training/online-self-paced/cissp-online-self-paced',
        permanent: true,
      },
      {
        source: '/cissp-strong',
        destination: '/landing/cissp-strong',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideCISSP-Web',
        destination: 'https://cloud.connect.isc2.org/cissp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Product Sheets/Concentrations-DIGITAL',
        destination: 'Concentrations-Product-Sheet',
        permanent: true,
      },
      {
        source: '/CPE-Handbook',
        destination: '/members/cpe-opportunities',
        permanent: true,
      },
      {
        source: '/CSSLP-Exam-Outline',
        destination: '/certifications/csslp/csslp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/csslp-preview',
        destination: '/training/online-instructor-led/csslp-online-instructor-led',
        permanent: true,
      },
      {
        source: '/Training/Courses/CSSLP-Training-Course',
        destination: '/training/online-instructor-led/csslp-online-instructor-led',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideCSSLP-Web',
        destination: 'https://cloud.connect.isc2.org/csslp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/ELCC-Exam-Outline',
        destination: '/certifications/cc/cc-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Entry-Level-Exam-Outline',
        destination: '/certifications/cc/cc-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Expert-Cloud-Security',
        destination: '/landing/expert-cloud-security',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Exam Outlines/HCISPP-DCO',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Exam Outlines/HCISPP-Exam-Outline',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/Training/Courses/HCISPP-Training-Course',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Product Sheets/HCISPP-DIGITAL',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideHCISPP-Web',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/Training/Courses/ISSAP-Training-Course',
        destination: '/training/online-self-paced/cissp-issap-online-self-paced',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideISSAP',
        destination: 'https://cloud.connect.isc2.org/issap-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Training/Courses/ISSEP-Training-Course',
        destination: '/training/online-self-paced/cissp-issep-online-self-paced',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideISSEP',
        destination: 'https://cloud.connect.isc2.org/issep-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Training/Courses/ISSMP-Training-Course',
        destination: '/training/online-self-paced/cissp-issmp-online-self-paced',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideISSMP',
        destination: 'https://cloud.connect.isc2.org/issmp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Leadership',
        destination: '/about/leadership',
        permanent: true,
      },
      {
        source: '/Training/Search/:path*',
        destination: '/training-search/:path*',
        permanent: true,
      },
      {
        source: '/newpricing',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Product Sheets/Overview-DIGITAL',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/PeaceofMind',
        destination: '/landing/exam-peace-of-mind',
        permanent: true,
      },
      {
        source: '/Landing/protect',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/Landing/secure',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/see-yourself-in-cybersecurity',
        destination: '/landing/see-yourself-in-cybersecurity',
        permanent: true,
      },
      {
        source: '/Landing/shield',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/SSCP-Exam-Outline',
        destination: '/certifications/sscp/sscp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Training/Courses/SSCP-Training-Course',
        destination: '/training/online-instructor-led/sscp-online-instructor-led',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Product Sheets/US-SSCP-DIGITAL',
        destination: '/certifications/sscp',
        permanent: true,
      },
      {
        source: '/-/media/ISC2/Certifications/Ultimate Guides/UltimateGuideSSCP',
        destination: 'https://cloud.connect.isc2.org/sscp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Webinars',
        destination: '/professional-development/webinars',
        permanent: true,
      },
      {
        source: '/Workforce',
        destination: '/research',
        permanent: true,
      },
      {
        source: '/Certifications/CAP/:slug*',
        destination: '/certifications/cgrc',
        permanent: true,
      },
      {
        source: '/Certifications/CISSP/Webcast-Series',
        destination: 'https://cloud.connect.isc2.org/cissp-an-inside-look',
        permanent: true,
      },
      {
        source: '/Certifications/Entry-Level',
        destination: '/certifications/cc',
        permanent: true,
      },
      {
        source: '/Certifications/Entry-Level/Exam-Outline',
        destination: '/certifications/cgrc/cc-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Certifications/Quiz',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/:path',
        destination: 'https://cloud.connect.isc2.org/:path-ultimate-guide',
        permanent: true,
      },
      {
        source: '/CGRC-Ultimate-Guide',
        destination: 'https://cloud.connect.isc2.org/cgrc-ultimate-guide',
        permanent: true,
      },
      {
        source: '/CISSP-Ultimate-Guide',
        destination: 'https://cloud.connect.isc2.org/cissp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/CISSP/jp',
        destination: 'https://cloud.connect.isc2.org/cissp-ultimate-guide-jp',
        permanent: true,
      },
      {
        source: '/CSSLP-Ultimate-Guide',
        destination: 'https://cloud.connect.isc2.org/csslp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/HCISPP',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/SSCP/jp',
        destination: 'https://cloud.connect.isc2.org/sscp-ultimate-guide-jp',
        permanent: true,
      },
      {
        source: '/Connect',
        destination: 'https://cloud.connect.isc2.org/preferences',
        permanent: true,
      },
      {
        source: '/Contact-Us/Account-Status',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/Contact-Us/account-status`,
        permanent: true,
      },
      {
        source: '/Contact-Us/FAQs',
        destination: '/contact-us',
        permanent: true,
      },
      {
        source: '/Contact-Us/Sponsorship-Opps',
        destination: '/contact-us',
        permanent: true,
      },
      {
        source: '/Development',
        destination: '/professional-development',
        permanent: true,
      },
      {
        source: '/Development/:slug',
        destination: '/professional-development',
        permanent: true,
      },
      {
        source: '/Events/Secure-London',
        destination: '/professional-development/events/secure-london',
        permanent: true,
      },
      {
        source: '/Events/SECURE-Singapore',
        destination: '/professional-development/events',
        permanent: true,
      },
      {
        source: '/Events/Secure-Washington-DC',
        destination: '/professional-development/events/secure-washington-dc',
        permanent: true,
      },
      {
        source: '/ISC2Logout',
        destination: '/',
        permanent: true,
      },
      {
        source: '/Job-Board',
        destination: '/job-opportunities',
        permanent: true,
      },
      {
        source: '/Member-Notices',
        destination: '/',
        permanent: true,
      },
      {
        source: '/Member-Resources/CPE-Overview',
        destination: '/members/cpe-opportunities',
        permanent: true,
      },
      {
        source: '/Member-Resources/ElectionsVoting',
        destination: '/',
        permanent: true,
      },
      {
        source: '/Member-Resources/ElectionsVoting/NotEligible',
        destination: '/',
        permanent: true,
      },
      {
        source: '/Member-Resources/Exclusive-Benefits',
        destination: '/members',
        permanent: true,
      },
      {
        source: '/Member-Resources/Exclusive-Benefits/Member-Perks',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/member-discount-program`,
        permanent: true,
      },
      {
        source: '/Member-Resources/InfoSecurity-Professional-Magazine',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/Member-Resources/InfoSecurity-Professional-Magazine/Archives',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/Member-Resources/Logo-Usage',
        destination: '/Policies-Procedures/Member-Policies',
        permanent: true,
      },
      {
        source: '/Membership/Blog-and-Magazine',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/News-and-Events/Event-Calendar',
        destination: '/professional-development/events',
        permanent: true,
      },
      {
        source: '/News-and-Events/Infosecurity-Professional-Insights',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/News-and-Events/InfoSecurity-Professional-Insights-Archive',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/News-and-Events/Podcasts',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/Preferences',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/privacy-center`,
        permanent: true,
      },
      {
        source: '/Reinstatement',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/Reinstatement`,
        permanent: true,
      },
      {
        source: '/Report-Issue',
        destination: '/contact-us',
        permanent: true,
      },
      {
        source: '/ISC2Login',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/login`,
        permanent: true,
      },
      {
        source: '/Sign-In',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/login`,
        permanent: true,
      },
      {
        source: '/Sign-In/Activate-Account',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/login/SelfRegister`,
        permanent: true,
      },
      {
        source: '/Sign-In/Change-Password',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/change-password`,
        permanent: true,
      },
      {
        source: '/Sign-In/Forgot-Password',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/login/ForgotPassword`,
        permanent: true,
      },
      {
        source: '/Sign-In/Registration',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/login/SelfRegister`,
        permanent: true,
      },
      {
        source: '/Sign-In/ResetPassword',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/login/ForgotPassword`,
        permanent: true,
      },
      {
        source: '/Training/Consult',
        destination: 'https://cloud.connect.isc2.org/consult',
        permanent: true,
      },
      {
        source: '/Training/Team-Consult',
        destination: '/training/enterprise-solutions',
        permanent: true,
      },
      {
        source: '/TrainingSearch',
        destination: '/training-search',
        permanent: true,
      },
      {
        source: '/TrainingSearchResult',
        destination: '/training-search',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CC/:slug(chapter\\-\\d{1,})',
        destination: '/certifications/cc/cc-self-study-resources-:slug',
        permanent: true,
      },
      {
        source: '/Training/Courses/Entry-Level-Training-Course',
        destination: '/training/online-self-paced/cc-online-self-paced',
        permanent: true,
      },
      {
        source: '/Certifications/CCSP/Certification-Exam-Outline',
        destination: '/certifications/ccsp/ccsp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Certifications/CCSP/Experience-Requirements',
        destination: '/certifications/ccsp/ccsp-experience-requirements',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CCSP',
        destination: '/certifications/ccsp/ccsp-self-study-resources',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CCSP/:path(domain\\-\\d{1,})',
        destination: '/certifications/ccsp/ccsp-self-study-resources-:path',
        permanent: true,
      },
      {
        source: '/Certifications/CGRC/Certification-Exam-Outline',
        destination: '/certifications/cgrc/cgrc-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Certifications/CGRC/Experience-Requirements',
        destination: '/certifications/cgrc/cgrc-experience-requirements',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CGRC',
        destination: '/certifications/cgrc/cgrc-self-study-resources',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CGRC/:slug(chapter\\-\\d{1,})',
        destination: '/certifications/cgrc/cgrc-self-study-resources-:slug',
        permanent: true,
      },
      {
        source: '/Certifications/CISSP/Certification-Exam-Outline',
        destination: '/certifications/cissp/cissp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Certifications/CISSP/Experience Requirements',
        destination: '/certifications/cissp/cissp-experience-requirements',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CISSP',
        destination: '/certifications/cissp/cissp-self-study-resources',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CISSP/:path(domain\\-\\d{1,})',
        destination: '/certifications/cissp/cissp-self-study-resources-:path',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CISSP-ISSAP',
        destination: '/certifications/cissp/cissp-self-study-resources',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CISSP-ISSAP/:path(chapter\\-\\d{1,})',
        destination: '/certifications/cissp-issap/cissp-issap-self-study-resources-:path',
        permanent: true,
      },

      {
        source: '/Training/Self-Study-Resources/CISSP-ISSEP',
        destination: '/certifications/cissp-issep/cissp-issep-self-study-resources',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CISSP-ISSEP/:path(chapter\\-\\d{1,})',
        destination: '/certifications/cissp-issep/cissp-issep-self-study-resources-:path',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CISSP-ISSMP',
        destination: '/certifications/cissp-issmp/cissp-issmp-self-study-resources',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CISSP-ISSMP/:path(chapter\\-\\d{1,})',
        destination: '/certifications/cissp-issmp/cissp-issmp-self-study-resources-:path',
        permanent: true,
      },
      {
        source: '/Certifications/CISSP-Concentrations/ISSMP-Domain-Change-FAQs',
        destination: '/certifications/cissp-issmp/cissp-issmp-domain-change-faq',
        permanent: true,
      },
      {
        source: '/Certifications/CSSLP/Certification-Exam-Outline',
        destination: '/certifications/csslp/csslp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Certifications/CSSLP/Domain-Refresh-FAQ',
        destination: '/certifications/csslp/csslp-domain-change-faq',
        permanent: true,
      },
      {
        source: '/Certifications/CSSLP/Experience-Requirements',
        destination: '/certifications/csslp/csslp-experience-requirements',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CSSLP',
        destination: '/certifications/csslp/csslp-self-study-resources',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CSSLP/:path(chapter\\-\\d{1,})',
        destination: '/certifications/csslp/csslp-self-study-resources-:path',
        permanent: true,
      },
      {
        source: '/Certifications/SSCP/Certification-Exam-Outline',
        destination: '/certifications/sscp/sscp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Certifications/SSCP/Experience-Requirements',
        destination: '/certifications/sscp/sscp-experience-requirements',
        permanent: true,
      },
      {
        source: '/Certifications/SSCP/Prerequisite-Pathway',
        destination: '/certifications/sscp/sscp-prerequisite-pathway',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/SSCP',
        destination: '/certifications/sscp/sscp-self-study-resources-chapter-1',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/SSCP/:path(chapter\\-\\d{1,})',
        destination: '/certifications/sscp/sscp-self-study-resources-:path',
        permanent: true,
      },
      {
        source: '/Certifications/HCISPP/Experience-Requirements',
        destination: '/certifications/hcispp/hcispp-experience-requirements',
        permanent: true,
      },
      {
        source: '/Events',
        destination: '/professional-development/events',
        permanent: true,
      },
      {
        source: '/Events/Partner-Events',
        destination: '/professional-development/events/partner-events',
        permanent: true,
      },
      {
        source: '/Events/Partner-Events/Infosecurity-Europe-2023-terms',
        destination:
          '/professional-development/events/partner-events/infosecurity-europe-2023-terms',
        permanent: true,
      },
      {
        source: '/News-and-Events/Webinars/Knowledge-Vault',
        has: [
          {
            type: 'query',
            key: 'commid',
          },
        ],
        destination: '/professional-development/webinars/knowledge-vault',
        permanent: false,
      },
      {
        source: '/News-and-Events/Webinars/:slug*',
        destination: '/professional-development/webinars/:slug*',
        permanent: true,
      },
      {
        source: '/Skill-Builders/:slug*',
        destination: '/professional-development/skill-builders/:slug*',
        permanent: true,
      },
      {
        source: '/certificate/Risk-Management-Practitioner-Certificates/member-pricing',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/risk-manag-practitioner-memberpricing`,
        permanent: true,
      },
      {
        source: '/certificate/CISO-Leadership-Certificates/member-pricing',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/ciso-leadership-member-pricing`,
        permanent: true,
      },
      {
        source: '/certificate/cloud-security-certificate/member-pricing',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/cloud-security-certificate-memberpricing`,
        permanent: true,
      },
      {
        source: '/certificate/healthcare-certificate/member-pricing',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/certificate/healthcare-certificate/member-pricing`,
        permanent: true,
      },
      {
        source: '/certificate/security-administration-operation-certificate/member-pricing',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/security-administration-memberpricing`,
        permanent: true,
      },
      {
        source: '/certificate/security-engineering-certificates/member-pricing',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/security-engineering-memberpricing`,
        permanent: true,
      },
      {
        source: '/Certificate/:path',
        destination: '/professional-development/certificates/:path-program',
        permanent: true,
      },
      {
        source: '/News-and-Events/Press-Room',
        destination: '/Insights/press-center',
        permanent: true,
      },
      {
        source: '/News-and-Events/Press-Room/:slug*',
        destination: '/Insights/press-center',
        permanent: true,
      },
      {
        source: '/InfoSecurity-Professional/InfoSecurity-Professional-Insights',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/InfoSecurity-Professional/InfoSecurity-Professional-Insights/Archive/',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/InfoSecurity-Professional/InfoSecurity-Professional-Insights/Archive/:slug*',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/InfoSecurity-Professional/Cloud-Security-Insights',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/InfoSecurity-Professional/Cloud-Security-Insights/Archive',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/InfoSecurity-Professional/Cloud-Security-Insights/Archive/:slug*',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/News/Features/:slug*',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/News/Opinion/:slug*',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/News',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/Resource-Center',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/InfoSecurity-Professional',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/InfoSecurity-Professional/Magazine-Archive',
        destination: '/insights',
        permanent: true,
      },
      {
        source: '/Candidate/Benefits/1MCC-Exam-Instructions',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/Candidate-Benefits/1MCC-exam-instructions`,
        permanent: true,
      },
      {
        source: '/candidate/benefits',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/Candidate-Benefits`,
        permanent: true,
      },
      {
        source: '/landing/cap-advance-career-strategy',
        destination: '/certifications/cgrc',
        permanent: true,
      },
      {
        source: '/landing/cap-mitigating-risk-security-framework',
        destination: '/certifications/cgrc',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/CAP',
        destination: '/certifications/cgrc',
        permanent: true,
      },
      {
        source: '/Research/CareerPursuers',
        destination: 'https://cloud.connect.isc2.org/career-pursuers-report',
        permanent: true,
      },
      {
        source: '/landing/careerpursuerswebinar',
        destination: 'https://cloud.connect.isc2.org/career-pursuers-report',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/CCSP',
        destination: 'https://cloud.connect.isc2.org/ccsp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/ccsp/jp',
        destination: 'https://cloud.connect.isc2.org/ccsp-ultimate-guide-jp',
        permanent: true,
      },
      {
        source: '/CCSP-Webcast',
        destination: 'https://cloud.connect.isc2.org/ccsp-webcast-series',
        permanent: true,
      },
      {
        source: '/Certifications/CCSP/Webcast-Series/',
        destination: 'https://cloud.connect.isc2.org/ccsp-webcast-series',
        permanent: true,
      },
      {
        source: '/Certifications/Cyber-Career-Starter/thank-you',
        destination: '/certifications/cc',
        permanent: true,
      },
      {
        source: '/Training/Cert-Prep-Kit',
        destination: 'https://cloud.connect.isc2.org/cert-prep-kit',
        permanent: true,
      },
      {
        source: '/Certifications/CISSP/Webcast-Series/',
        destination: 'https://cloud.connect.isc2.org/cissp-an-inside-look',
        permanent: true,
      },
      {
        source: '/landing/cloud-adoption-and-the-skills-shortage',
        destination: 'https://cloud.connect.isc2.org/cloud-adoption-and-the-skills-shortage',
        permanent: true,
      },
      {
        source: '/Landing/Expert-Cloud-Security/Tips-Cloud-Migration',
        destination: 'https://cloud.connect.isc2.org/cloud-migration-tips',
        permanent: true,
      },
      {
        source: '/Landing/Expert-Cloud-Security/Skills-For-Professionals',
        destination: 'https://cloud.connect.isc2.org/cloud-security-skills-for-professionals',
        permanent: true,
      },
      {
        source: '/:path(commit|Cert-Prep-Kit)',
        destination: 'https://cloud.connect.isc2.org/commit',
        permanent: true,
      },
      {
        source: '/training/consult',
        destination: 'https://cloud.connect.isc2.org/consult',
        permanent: true,
      },
      {
        source: '/CPEguide',
        destination: '/professional-development',
        permanent: true,
      },
      {
        source: '/Landing/csslp-devsecops',
        destination: 'https://cloud.connect.isc2.org/csslp-devsecops',
        permanent: true,
      },
      {
        source: '/Landing/csslp-secure-software-development',
        destination: 'https://cloud.connect.isc2.org/csslp-secure-software-development',
        permanent: true,
      },
      {
        source: '/Landing/csslp-software-developer-confessions',
        destination: 'https://cloud.connect.isc2.org/csslp-software-developer-confessions',
        permanent: true,
      },
      {
        source: '/Certifications/CSSLP/Webcast-Series/',
        destination: 'https://cloud.connect.isc2.org/csslp-webcast-series',
        permanent: true,
      },
      {
        source: '/Certifications/CSSLP/Webcast-Series',
        destination: 'https://cloud.connect.isc2.org/csslp-webcast-series',
        permanent: true,
      },
      {
        source: '/Certifications/Cyber-Career-Starter',
        destination: 'https://cloud.connect.isc2.org/cyber-career-starter',
        permanent: true,
      },
      {
        source: '/landing/Cyberthreat-Defense-Report',
        destination: 'https://cloud.connect.isc2.org/cyberthreat-defense-report',
        permanent: true,
      },
      {
        source: '/enterpriseebook',
        destination: 'https://cloud.connect.isc2.org/enterprise-ebook',
        permanent: true,
      },
      {
        source: '/landing/enterprisewebinar',
        destination: 'https://cloud.connect.isc2.org/enterprise-training-webinar',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/HCISPP',
        destination: '/professional-development/certificates/Healthcare-Certificates-program',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP-:path',
        destination: 'https://cloud.connect.isc2.org/:path-flashcards',
        permanent: true,
      },
      {
        source: '/Cert-Prep-Kit',
        destination: 'https://cloud.connect.isc2.org/cert-prep-kit',
        permanent: true,
      },
      {
        source: '/CISSP-Flashcards',
        destination: 'https://cloud.connect.isc2.org/cissp-flashcards',
        permanent: true,
      },
      {
        source: '/Landing/Commit',
        destination: 'https://cloud.connect.isc2.org/commit',
        permanent: true,
      },
      {
        source: '/Landing/EnterpriseEbook',
        destination: 'https://cloud.connect.isc2.org/enterprise-ebook',
        permanent: true,
      },
      {
        source: '/Landing/qualified-cybersecurity-professional',
        destination: 'https://cloud.connect.isc2.org/qualified-cybersecurity-professional',
        permanent: true,
      },
      {
        source: '/Landing/qualified-cybersecurity-professional-kr',
        destination: 'https://cloud.connect.isc2.org/qualified-cybersecurity-professional-kr',
        permanent: true,
      },
      {
        source: '/Landing/qualified-cybersecurity-team',
        destination: 'https://cloud.connect.isc2.org/qualified-cybersecurity-team',
        permanent: true,
      },
      {
        source: '/Landing/qualified-cybersecurity-team-JP',
        destination: 'https://cloud.connect.isc2.org/qualified-cybersecurity-team-jp',
        permanent: true,
      },
      {
        source: '/Landing/Expert-Cloud-Security/skills-for-professionals-jp',
        destination: 'https://cloud.connect.isc2.org/cloud-security-skills-for-professionals-jp',
        permanent: true,
      },
      {
        source: '/landing/sscp-7-benefits',
        destination: 'https://cloud.connect.isc2.org/sscp-7-benefits',
        permanent: true,
      },
      {
        source: '/landing/sscp-cyber-hero',
        destination: 'https://cloud.connect.isc2.org/sscp-cyber-hero',
        permanent: true,
      },
      {
        source: '/landing/sscp-hr-managers',
        destination: 'https://cloud.connect.isc2.org/sscp-hr-managers',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/HCISPP',
        destination: '/professional-development/certificates/healthcare-certificates-program',
        permanent: true,
      },
      {
        source: '/Certifications/HCISPP/Webcast-Series',
        destination: 'https://cloud.connect.isc2.org/hcispp-webcast-series',
        permanent: true,
      },
      {
        source: '/Certifications/HCISPP/Webcast-Series',
        destination: 'https://cloud.connect.isc2.org/hcispp-webcast-series',
        permanent: true,
      },
      {
        source: '/Resource-Center/eBooks/how-to-break-into-cybersecurity',
        destination: 'https://cloud.connect.isc2.org/how-to-break-into-cybersecurity-ebook',
        permanent: true,
      },
      {
        source: '/Landing/Expert-Cloud-Security/Invest-Team-Training',
        destination: 'https://cloud.connect.isc2.org/invest-cloud-security-team-training',
        permanent: true,
      },
      {
        source: '/Training/Investment-Program',
        destination: 'https://cloud.connect.isc2.org/investment-program',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/ISSAP',
        destination: 'https://cloud.connect.isc2.org/issap-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/ISSMP',
        destination: 'https://cloud.connect.isc2.org/issmp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Landing/EnterpriseEbook',
        destination: 'https://cloud.connect.isc2.org/enterprise-ebook',
        permanent: true,
      },
      {
        source: '/Training/officialatwork',
        destination: 'https://cloud.connect.isc2.org/train-the-trainer',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/SSCP',
        destination: 'https://cloud.connect.isc2.org/sscp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/sscp/jp',
        destination: 'https://cloud.connect.isc2.org/sscp-ultimate-guide-jp',
        permanent: true,
      },
      {
        source: '/Certifications/SSCP/Webcast-Series',
        destination: 'https://cloud.connect.isc2.org/sscp-webcast-series',
        permanent: true,
      },
      {
        source: '/training/team-consult',
        destination: 'training/enterprise-solutions',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/CISSP',
        destination: 'https://cloud.connect.isc2.org/cissp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/CISSP/jp',
        destination: 'https://cloud.connect.isc2.org/cissp-ultimate-guide-jp',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/CISSP/kr',
        destination: 'https://cloud.connect.isc2.org/cissp-ultimate-guide-kr',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/CSSLP',
        destination: 'https://cloud.connect.isc2.org/csslp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Certifications/Ultimate-Guides/ISSEP',
        destination: 'https://cloud.connect.isc2.org/issep-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Sign-In',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/idp/login?app=0sp4N000000PGQG`,
        permanent: true,
      },
      {
        source: '/volunteer/volunteer-interest',
        destination: '/volunteer',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CAP/Domain-:path(\\d{1,})',
        destination: '/certifications/cgrc/cgrc-self-study-resources-chapter-:path',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CCSP/chapter-:path(\\d{1,})',
        destination: '/certifications/ccsp/ccsp-self-study-resources-domain-:path',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CCSP/chapter-:path(\\d{1,})',
        destination: '/certifications/ccsp/ccsp-self-study-resources-domain-:path',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CISSP/Chapter-:path(\\d{1,})',
        destination: '/certifications/cissp/cissp-self-study-resources-domain-:path',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP/Security-and-Risk-Management',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-1',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP/Asset-Security',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-2',
        permanent: true,
      },
      {
        source:
          '/Training/Self-Study-Resources/Flashcards/CISSP/Security-Architecture-and-Engineering',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-3',
        permanent: true,
      },
      {
        source:
          '/Training/Self-Study-Resources/Flashcards/CISSP/Communication-and-Network-Security',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-4',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP/Identity-and-Access-Management',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-5',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP/Security-Assessment-and-Testing',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-6',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP/Security-Operations',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-7',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP/Software-Development',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-8',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/CISSP/Software-Development-Security',
        destination: '/certifications/cissp/cissp-self-study-resources-Domain-9',
        permanent: true,
      },
      {
        source:
          '/Training/Self-Study-Resources/Flashcards/CISSP-ISSAP/Architect-for-Governance-Compliance-and-Risk-Management',
        destination: '/certifications/cissp-issap/cissp-issap-self-study-resources-chapter-1',
        permanent: true,
      },
      {
        source:
          '/Training/Self-Study-Resources/Flashcards/CISSP-ISSAP/Security-Architecture-Modeling',
        destination: '/certifications/cissp-issap/cissp-issap-self-study-resources-chapter-2',
        permanent: true,
      },
      {
        source:
          '/Training/Self-Study-Resources/Flashcards/CISSP-ISSAP/Infrastructure-Security-Architecture',
        destination: '/certifications/cissp-issap/cissp-issap-self-study-resources-chapter-3',
        permanent: true,
      },
      {
        source:
          '/Training/Self-Study-Resources/Flashcards/CISSP-ISSAP/Identity-and-Access-Management-Architecture',
        destination: '/certifications/cissp-issap/cissp-issap-self-study-resources-chapter-4',
        permanent: true,
      },
      {
        source:
          '/Training/Self-Study-Resources/Flashcards/CISSP-ISSAP/Architect-for-Application-Security',
        destination: '/certifications/cissp-issap/cissp-issap-self-study-resources-chapter-5',
        permanent: true,
      },
      {
        source:
          '/Training/Self-Study-Resources/Flashcards/CISSP-ISSAP/Security-Operations-Architect',
        destination: '/certifications/cissp-issap/cissp-issap-self-study-resources-chapter-6',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/HCISPP/:path(chapter\\-\\d{1,})',
        destination: '/certifications/hcispp',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/HCISPP/:path(chapter\\-\\d{1,})',
        destination: '/certifications/hcispp',
        permanent: true,
      },
      {
        source: '/Voucher-Offer',
        destination: 'https://enroll.isc2.org/',
        permanent: true,
      },
      {
        source: '/Build-CC-Team',
        destination: 'https://cloud.connect.isc2.org/cc-team-consult',
        permanent: true,
      },
      {
        source: '/training/promo30off',
        destination: '/training',
        permanent: true,
      },
      {
        source: '/Expert-Cloud-Security/Tips-Cloud-Migration',
        destination: 'https://cloud.connect.isc2.org/cloud-migration-tips',
        permanent: true,
      },
      {
        source: '/CAP-Product-Sheet',
        destination: '/certifications/cgrc',
        permanent: true,
      },
      //#endregion
      //#region Added on 8/12/2023 Post launch
      {
        source: '/CISSP',
        destination: '/certifications/cissp',
        permanent: true,
      },
      {
        source: '/CAP',
        destination: '/certifications/cgrc',
        permanent: true,
      },
      {
        source: '/CCSP',
        destination: '/certifications/ccsp',
        permanent: true,
      },
      {
        source: '/SSCP',
        destination: '/certifications/sscp',
        permanent: true,
      },
      {
        source: '/CGRC',
        destination: '/certifications/cgrc',
        permanent: true,
      },
      {
        source: '/CSSLP',
        destination: '/certifications/csslp',
        permanent: true,
      },
      {
        source: '/CISSP-ISSAP',
        destination: '/certifications/cissp-issap',
        permanent: true,
      },
      {
        source: '/CISSP-ISSEP',
        destination: '/certifications/cissp-issep',
        permanent: true,
      },
      {
        source: '/CCSP-path',
        destination: '/landing/ccsp-path',
        permanent: true,
      },
      {
        source: '/CISSP-ISSMP',
        destination: '/certifications/cissp-issmp',
        permanent: true,
      },
      {
        source: '/ISSAP',
        destination: '/certifications/cissp-issap',
        permanent: true,
      },
      {
        source: '/ISSEP',
        destination: '/certifications/cissp-issep',
        permanent: true,
      },
      {
        source: '/ISSMP',
        destination: '/certifications/cissp-issmp',
        permanent: true,
      },
      {
        source: '/certified-in-cybersecurity',
        destination: '/certifications/cc',
        permanent: true,
      },
      {
        source: '/cc',
        destination: '/certifications/cc',
        permanent: true,
      },
      {
        source: '/center',
        destination: 'https://iamcybersafe.org/s/',
        permanent: true,
      },
      {
        source: '/test',
        destination: '/training/private-on-site',
        permanent: true,
      },
      {
        source: '/CISSP-CAT',
        destination: '/certifications/cissp/cissp-cat',
        permanent: true,
      },
      {
        source: '/Cloud-Security',
        destination: '/landing/cloud-security',
        permanent: true,
      },
      {
        source: '/cybersecurity-awareness-month',
        destination: '/landing/cybersecurity-awareness-month',
        permanent: true,
      },
      {
        source: '/Cybersecurity-Leadership',
        destination: '/landing/cybersecurity-awareness-month',
        permanent: true,
      },
      {
        source: '/Entry-Level-Cybersecurity',
        destination: '/Landing/Entry-Level-Cybersecurity',
        permanent: true,
      },
      {
        source: '/Entry-Level-Exam-Outline',
        destination: '/certifications/cc/cc-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/Expert-Cloud-Security',
        destination: '/landing/expert-cloud-security',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/frequently-asked-questions',
        permanent: true,
      },
      {
        source: '/fivesteps',
        destination: '/insights/2019/05/5-everyday-skills-an-it-professional-must-have',
        permanent: true,
      },
      {
        source: '/Governance-Risk-Compliance',
        destination: '/Landing/Governance-Risk-Compliance',
        permanent: true,
      },
      {
        source: '/HCISPP-DCO',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/HCISPP-Exam-Outline',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/hcispp-preview',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/HCISPP-Product-Sheet',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/HCISPP-Ultimate-Guide',
        destination: '/certifications/hcissp',
        permanent: true,
      },
      {
        source: '/issap-preview',
        destination: '/training/online-self-paced/cissp-issap-online-self-paced',
        permanent: true,
      },
      {
        source: '/ISSAP-Ultimate-Guide',
        destination: 'https://cloud.connect.isc2.org/issap-ultimate-guide',
        permanent: true,
      },
      {
        source: '/issmp-preview',
        destination: '/training/online-self-paced/cissp-issmp-online-self-paced',
        permanent: true,
      },
      {
        source: '/ISSMP-Ultimate-Guide',
        destination: 'https://cloud.connect.isc2.org/issmp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/Network-Security',
        destination: '/landing/network-security',
        permanent: true,
      },
      {
        source: '/new-cert',
        destination: '/certifications/cc',
        permanent: true,
      },
      {
        source: '/newpricing',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/NorthropGrumman',
        destination: '/landing/northropgrumman',
        permanent: true,
      },
      {
        source: '/Overview-Product-Sheet',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/PDIPromo',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/PeaceofMind',
        destination: '/landing/exam-peace-of-mind',
        permanent: true,
      },
      {
        source: '/protect',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/secure',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/see-yourself-in-cybersecurity',
        destination: '/landing/see-yourself-in-cybersecurity',
        permanent: true,
      },
      {
        source: '/shield',
        destination: '/landing/promo-expired',
        permanent: true,
      },
      {
        source: '/Software-Security',
        destination: '/landing/software-security',
        permanent: true,
      },
      {
        source: '/SSCP-Exam-Outline',
        destination: '/certifications/sscp/sscp-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/sscp-preview',
        destination: '/training/online-instructor-led/sscp-online-instructor-led',
        permanent: true,
      },
      {
        source: '/SSCP-Product-Sheet',
        destination: '/certifications/sscp',
        permanent: true,
      },
      {
        source: '/SSCP-Ultimate-Guide',
        destination: 'https://cloud.connect.isc2.org/sscp-ultimate-guide',
        permanent: true,
      },
      {
        source: '/study-resources',
        destination: '/training/self-study-resources',
        permanent: true,
      },
      {
        source: '/throw-down-the-ladder',
        destination: '/Landing/throw-down-the-ladder',
        permanent: true,
      },
      {
        source: '/Exams/Report-Exam-Fraud',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/report-fraud`,
        permanent: true,
      },
      {
        source: '/cissp-how-to-certify.aspx',
        destination: '/certifications/cissp',
        permanent: true,
      },
      {
        source: '/associate/default.aspx',
        destination: '/certifications/associate',
        permanent: true,
      },
      {
        source: '/credential_waiver/default.aspx',
        destination: '/Policies-Procedures/Member-Policies',
        permanent: true,
      },
      {
        source: '/member-home',
        destination: '/members',
        permanent: true,
      },
      {
        source: '/MemberVerification',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/MemberVerification`,
        permanent: true,
      },
      {
        source: '/About/Member-Counts',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/isc2gether-register',
        destination: 'https://app.helperhelper.com/signup/1185?show=team',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/Flashcards/SSCP',
        destination: '/certifications/sscp/sscp-self-study-resources-chapter-1',
        permanent: true,
      },
      {
        source: '/armyignited',
        destination: '/landing/armyignited',
        permanent: true,
      },
      {
        source: '/boozallen',
        destination: '/landing/boozallen',
        permanent: true,
      },
      {
        source: '/Membership/Volunteer-Grow',
        destination: '/volunteer',
        permanent: true,
      },
      {
        source: '/Membership/CPE-Opportunities',
        destination: '/members/cpe-opportunities',
        permanent: true,
      },
      {
        source: '/professional-development/events/webinars',
        destination: '/professional-development/webinars',
        permanent: true,
      },
      {
        source: '/professional-development/events/webinars/APAC-Webinars',
        destination: '/professional-development/webinars/apac-webinars',
        permanent: true,
      },
      {
        source: '/professional-development/events/webinars/Knowledge-Vault',
        destination: '/professional-development/webinars/knowledge-vault',
        permanent: true,
      },
      {
        source: '/professional-development/events/webinars/ThinkTank',
        has: [
          {
            type: 'query',
            key: 'commid',
            value: '592789',
          },
        ],
        destination: '/professional-development/webinars/thinktank',
        permanent: true,
      },
      {
        source: '/hcispp-how-to-certify/default.aspx',
        destination: '/certifications/hcispp',
        permanent: true,
      },
      {
        source: '/sscp-how-to-certify.aspx',
        destination: '/certifications/sscp',
        permanent: true,
      },
      {
        source: '/cap-how-to-certify.aspx',
        destination: '/certifications/cgrc',
        permanent: true,
      },
      {
        source: '/csslp-how-to-certify.aspx',
        destination: '/certifications/csslp',
        permanent: true,
      },
      {
        source: '/ccsp-how-to-certify/default.aspx',
        destination: '/certifications/ccsp',
        permanent: true,
      },
      {
        source: '/volunteer-days',
        destination: '/Insights/2023/08/announcing-isc2gether-volunteer-today-shape-tomorrow',
        permanent: true,
      },
      {
        source: '/APAC-Enterprise-Catalog',
        destination: '/training/enterprise-solutions',
        permanent: true,
      },
      {
        source: '/isc2gether',
        destination: '/landing/isc2gether',
        permanent: true,
      },
      {
        source: '/Research/(.*)',
        destination: '/research',
        permanent: true,
      },
      //#endregion
      //#region redirects as on 9/7/2023
      {
        source: '/associate',
        destination: '/certifications/associate',
        permanent: true,
      },
      {
        source: '/Certifications/CC/Certification-Exam-Outline',
        destination: '/certifications/cc/cc-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/memberlogin.aspx',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/login/`,
        permanent: true,
      },
      {
        source: '/Insights/press-release',
        destination: '/Insights/press-center',
        permanent: true,
      },
      {
        source: '/uploadedFiles/Certification_Programs/CBT-Examination-Agreement.pdf',
        destination: '/exams/exam-agreement',
        permanent: true,
      },
      {
        source: '/professional-development/events/webinars/Security-Briefing',
        destination: '/professional-development/webinars',
        permanent: true,
      },
      {
        source: '/Member-Resources/Member-Benefits',
        destination: '/members',
        permanent: true,
      },
      {
        source: '/Research/Workforce-Study',
        destination: '/research',
        permanent: true,
      },
      {
        source: '/callback',
        destination: '/contact-us',
        permanent: true,
      },
      {
        source: '/cissp/default.aspx',
        destination: '/certifications/cissp',
        permanent: true,
      },
      {
        source: '/Membership/CPE-Partners',
        destination: '/members/cpe-partners',
        permanent: true,
      },
      {
        source: '/Notice/New-Cert/Exam-Outline',
        destination: '/exams/before-your-exam',
        permanent: true,
      },
      {
        source: '/professional-development/events/webinars/EMEA-Webinars',
        destination: '/professional-development/webinars/emea-webinars',
        permanent: true,
      },
      {
        source: '/CPE-Portal-Questions',
        destination: '/members/cpe-opportunities',
        permanent: true,
      },
      {
        source: '/endorsement.aspx',
        destination: '/Endorsement',
        permanent: true,
      },
      {
        source: '/professional-development/events/webinars/ThinkTank',
        destination: '/professional-development/webinars/thinktank',
        permanent: true,
      },
      {
        source: '/Membership',
        destination: '/members',
        permanent: true,
      },
      {
        source: '/Development/Express-Learning-Courses/A-Security-Professionals-Guide-to-AI',
        destination: '/professional-development',
        permanent: true,
      },
      {
        source: '/Training/Self-Study-Resources/CC',
        destination: '/training/online-self-paced/cc-online-self-paced',
        permanent: true,
      },
      {
        source: '/100k',
        destination: '/landing/1mcc',
        permanent: true,
      },
      {
        source: '/certifications/sscp/sccp-experience-requirements',
        destination: '/certifications/sscp/sscp-experience-requirements',
        permanent: true,
      },
      {
        source: '/training/self-study-resources/flashcards/sscp/chapter-1',
        destination: '/certifications/sscp/sscp-self-study-resources-chapter-1',
        permanent: true,
      },
      {
        source: '/Certifications/CC/Certification-Exam-Outline',
        destination: '/certifications/cc/cc-certification-exam-outline',
        permanent: true,
      },
      {
        source: '/d2l/home',
        destination: 'https://learn.isc2.org/d2l/home',
        permanent: true,
      },
      {
        source: '/d2l',
        destination: 'https://learn.isc2.org/d2l/home',
        permanent: true,
      },
      {
        source: '/professional-development/certificates/Healthcare-Certificate',
        destination: '/professional-development/certificates/healthcare-certificates-program',
        permanent: true,
      },
      {
        source: '/verify',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/MemberVerification`,
        permanent: true,
      },
      {
        source: '/MemberHome',
        destination: `${process.env.NEXT_PUBLIC_SALESFORCE_AUTHURL}/s/Member-Notices`,
        permanent: true,
      },
      {
        source: '/landing/hcispp-(.*)',
        destination: '/professional-development/certificates/healthcare-certificates-program',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders',
        destination: '/professional-development/courses#Express%20Courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/cloud-security',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/cybersecurity-leadership',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/governance-risk-and-compliance',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/network-security',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/security-operations',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/software-security',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/cloud-security/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/cybersecurity-leadership/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/Governance-Risk-and-Compliance/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/network-security/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/security-operations/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/skill-builders/software-security/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/cloud-security',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/cybersecurity-leadership',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/grc',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/network-security',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/non-technical',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/security-operations',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/software-security',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/cloud-security/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/cybersecurity-leadership/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/grc/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/network-security/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/non-technical/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/security-operations/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      {
        source: '/professional-development/express-courses/software-security/mem',
        destination: '/professional-development/courses',
        permanent: true,
      },
      //#endregion
    ];

    return isPreview ? [...mediaRedirects, ...baseRedirects] : baseRedirects;
  },

  async rewrites() {
    // When in connected mode we want to proxy Sitecore paths off to Sitecore
    return [
      // API endpoints
      {
        source: '/sitecore/api/:path*',
        destination: `${jssConfig.sitecoreApiHost}/sitecore/api/:path*`,
      },
      // media items
      {
        source: '/-/:path*',
        destination: `${jssConfig.sitecoreApiHost}/${jssConfig.sitecoreEnvironment}/:path*`,
      },
      // visitor identification
      {
        source: '/layouts/system/:path*',
        destination: `${jssConfig.sitecoreApiHost}/layouts/system/:path*`,
      },
      // healthz check
      {
        source: '/healthz',
        destination: '/api/healthz',
      },
      // rewrite for Sitecore service pages
      {
        source: '/sitecore/service/:path*',
        destination: `${jssConfig.sitecoreApiHost}/sitecore/service/:path*`,
      },
    ];
  },
};

module.exports = {
  // Run the base config through any configured plugins
  ...Object.values(plugins).reduce((acc, plugin) => plugin(acc), nextConfig),
};
