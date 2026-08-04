using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Sitecore.Data;

namespace ISC2.Foundation.GraphQL
{
    public struct Templates
    {
        public struct VotingRedirector
        {
            public static readonly ID SharedKeyFieldId = new ID("{43638EF2-E5A2-4BBC-92FB-05D171450115}");
            public static readonly ID RedirectUrlFieldId = new ID("{3ED0E821-F3DD-4E8E-8EE1-D8B2A026E0DB}");
            public static readonly ID VotingHashSuitFieldId = new ID("{BA0240B8-D0D5-4DF5-AF5B-7EA5B9A59FFF}");
        }
    }
}
