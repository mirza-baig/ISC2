using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.JavaScriptServices.Configuration;
using Sitecore.JavaScriptServices.ViewEngine.LayoutService.Pipelines.GetLayoutServiceContext;
using Sitecore.LayoutService.ItemRendering.Pipelines.GetLayoutServiceContext;
using Sitecore.Links;
using Sitecore.Links.UrlBuilders;
using Sitecore.Resources.Media;

namespace ISC2.Foundation.SitecoreUtilities.LayoutResolver
{
    public class LayoutSiteContextExtension : JssGetLayoutServiceContextProcessor
    {
        public LayoutSiteContextExtension(IConfigurationResolver configurationResolver) : base(configurationResolver)
        {
        }

        protected override void DoProcess(GetLayoutServiceContextArgs args, AppConfiguration application)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (Context.Site == null)
            {
                return;
            }

            //Canonical URL
            if (!args.ContextData.ContainsKey("canonicalUrl"))
            {
                var targetHostname = Context.Site.TargetHostName;

                var itemUrl = LinkManager.GetItemUrl(Context.Item);

                var canonicalUrl = itemUrl.Equals("/")
                    ? $"https://{targetHostname}"
                    : $"https://{targetHostname}{itemUrl}";

                args.ContextData.Add("canonicalUrl", canonicalUrl);
            }

            // Global fallback image
            if(!args.ContextData.ContainsKey("globalFallbackImage"))
            {
                var siteInfo = Context.Site.SiteInfo;
                var siteItem = Context.Database.GetItem(siteInfo.RootPath, Language.Parse(siteInfo.Language));

                var globalFallbackImage = ((ImageField)siteItem.Fields["globalFallbackImage"]).MediaItem;

                var mediaOptions = new MediaUrlBuilderOptions();
                    mediaOptions.AlwaysIncludeServerUrl = true;

                if (globalFallbackImage != null)
                    args.ContextData.Add("globalFallbackImage", MediaManager.GetMediaUrl(globalFallbackImage, mediaOptions));
            }
        }
    }
}