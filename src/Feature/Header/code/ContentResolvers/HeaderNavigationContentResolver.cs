using System.Linq;
using Sitecore.Data.Items;
using Sitecore.Mvc.Presentation;
using Sitecore.LayoutService.Configuration;
using Newtonsoft.Json.Linq;
using ISC2.Foundation.SitecoreUtilities.Extensions;

namespace ISC2.Feature.Header.ContentResolvers
{
    public class HeaderNavigationContentResolver : Sitecore.LayoutService.ItemRendering.ContentsResolvers.RenderingContentsResolver
    {
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var datasource = !string.IsNullOrEmpty(rendering.DataSource)
                ? rendering.RenderingItem?.Database.GetItem(rendering.DataSource)
                : null;

            if (datasource == null)
            {
                return null;
            }

            var navigationItems = datasource.Children
                .Where(IsValidHeaderNavigationChild)
                .Select(layoutOption =>
                {
                    var serializedItem = ProcessItem(layoutOption, rendering, renderingConfig);
                    serializedItem["columnLinks"] = GetColumnLinks(layoutOption, rendering, renderingConfig);
                    serializedItem["tabs"] = GetNavigationTabs(layoutOption, rendering, renderingConfig);
                    serializedItem["promoCard"] = GetPromoCard(layoutOption, rendering, renderingConfig);
                    return serializedItem;
                });

            var content = ProcessItem(datasource, rendering, renderingConfig);
            content["navigationItems"] = JArray.FromObject(navigationItems);

            return content;
        }

        private JArray GetColumnLinks(Item parent, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var serializedColumnWithLinks = parent.Children
                .Where(child => child.IsValid())
                .Where(IsColumnLinksItem)
                .Select(column =>
                {
                    var serializedItem = ProcessItem(column, rendering, renderingConfig);
                    serializedItem["links"] = ProcessItems(column.Children, rendering, renderingConfig);
                    return serializedItem;
                });

            return JArray.FromObject(serializedColumnWithLinks);
        }

        private JArray GetNavigationTabs(Item parent, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var serializedTabsWithColumnsChildren = parent.Children
                .Where(child => child.IsValid())
                .Where(IsNavigationTabItem)
                .Select(tab =>
                {
                    var serializedItem = ProcessItem(tab, rendering, renderingConfig);
                    serializedItem["columnLinks"] = GetColumnLinks(tab, rendering, renderingConfig);
                    return serializedItem;
                });

            return JArray.FromObject(serializedTabsWithColumnsChildren);
        }
        private JObject GetPromoCard(Item parent, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var promoCard = parent.Children.FirstOrDefault(IsPromoCardItem);
            return promoCard == null ? null : ProcessItem(promoCard, rendering, renderingConfig);
        }

        private bool IsValidHeaderNavigationChild(Item child) => child.IsValid() && (IsColumnLayout(child) || IsVerticalTabLayout(child));

        private bool IsColumnLayout(Item layoutOption)
            => layoutOption.DescendsFrom(Templates.HeaderNavigation.ColumnLayoutTemplateId);

        private bool IsVerticalTabLayout(Item layoutOption)
            => layoutOption.DescendsFrom(Templates.HeaderNavigation.VerticalTabLayoutTemplateId);

        private bool IsColumnLinksItem(Item item) => item.DescendsFrom(Templates.HeaderNavigation.ColumnLinksTemplateId);

        private bool IsNavigationTabItem(Item item) => item.DescendsFrom(Templates.HeaderNavigation.NavigationTabTemplateId);

        private bool IsPromoCardItem(Item item) => item.DescendsFrom(Templates.HeaderNavigation.PromoCardTemplateId);

    }
}
