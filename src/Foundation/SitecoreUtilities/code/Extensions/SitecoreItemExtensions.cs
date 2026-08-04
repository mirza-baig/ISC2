using Sitecore.Data.Items;

namespace ISC2.Foundation.SitecoreUtilities.Extensions
{
    public static class SitecoreItemExtensions
    {
        public static bool IsValid(this Item item) => item != null && item.Versions.Count > 0;
    }
}