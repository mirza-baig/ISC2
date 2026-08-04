using Newtonsoft.Json.Linq;
using Sitecore.Data.Query;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using System;
using System.Linq;

namespace ISC2.Foundation.SitecoreUtilities.ContentResolvers
{
    public class DataSourceAndChildrenContentResolver : Sitecore.LayoutService.ItemRendering.ContentsResolvers.RenderingContentsResolver
    {

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var children = rendering.Item?.Children.Where(child => child != null && child.Versions.Count > 0);

               return new JObject
               {
                    ["id"] = new JObject()
                    {
                        ["value"] = (JToken)rendering.Item.ID.Guid.ToString("D"),
                    },
                    ["item"] = this.ProcessItem(rendering.Item, rendering, renderingConfig),
                    ["children"] = this.ProcessItems(children, rendering, renderingConfig)
               };
            }
            catch (Exception ex)
            {
                Sitecore.Diagnostics.Log.Error($"Error during DataSourceAndChildrenContentResolver: {ex.Message}", this);
                return new JObject
                {
                    ["id"] = new JObject(),
                    ["item"] = new JObject(),
                    ["children"] = new JArray()
                };
            }
        }
    }
}