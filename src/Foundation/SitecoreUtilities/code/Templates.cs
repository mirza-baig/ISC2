using Sitecore.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ISC2.Foundation.SitecoreUtilities
{
    public class Templates
    {
        public struct WorkBoxDraftItem
        {
            public static readonly ID WorkflowId = new ID("{237D2582-24EA-42C5-9879-6912AFA5E5DB}");
            public static readonly ID DraftStateID = new ID("{6B5EAF64-AB1A-4F77-AE69-D66653278551}");
            public static readonly ID ArchiveFloder = new ID("{EA2E3A63-2A72-4E16-AF48-0EFD095AB242}");
            public static readonly ID ArchiveDays = new ID("{67D74FC3-54E0-4CFF-9D34-7A10678345D9}");
            public static readonly ID ArchiveExpiryDays = new ID("{19BFB0C5-9ACA-47F2-ADA2-F38BB22CC2D5}");
            public static readonly ID DeleteArchivedItems = new ID("{FC69EC69-480B-4514-9192-B9949D898200}");
        }

        public struct Dictionary
        {
            public static readonly ID DictionaryFolderTemplateId = new ID("{267D9AC7-5D85-4E9D-AF89-99AB296CC218}");
            public static readonly ID DictionaryEntryTemplateId = new ID("{6D1CD897-1936-4A3A-A511-289A94C2A7B1}");
        }
    }
}