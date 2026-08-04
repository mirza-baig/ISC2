using Newtonsoft.Json;
using Sitecore.Mvc.Names;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ISC2.Foundation.SitecoreUtilities.Models
{
    public class Image
    {
        public string Src { get; set; }
        public string Alt { get; set; }
        public string Width { get; set; }
        public string Height { get; set; }
    }
}