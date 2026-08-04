using ISC2.Foundation.SitecoreUtilities.Extensions;
using Newtonsoft.Json.Linq;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using System;
using System.Linq;

namespace ISC2.Foundation.SitecoreUtilities.ContentResolvers
{
    public class DataSourceAndThreeLevelDepthContentResolver : Sitecore.LayoutService.ItemRendering.ContentsResolvers.RenderingContentsResolver
    {
        private const int MaxDepth = 3;

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                Item contextItem = GetContextItem(rendering, renderingConfig);
                if (contextItem == null)
                {
                    return null;
                }

                return ProcessItemAndValidChildren(contextItem, rendering, renderingConfig);
            }
            catch (Exception ex)
            {
                Sitecore.Diagnostics.Log.Error($"Error during HeaderSigninNavigationResolver: {ex.Message}", this);
                return new
                {
                    id = "",
                    name = "",
                    displayName = "",
                    fields = new JArray(),
                    children = new JArray()
                };
            }
        }
        private JObject ProcessItemAndValidChildren(Item parent, Rendering rendering, IRenderingConfiguration renderingConfig, int currentDepth = 1)
        {
            JObject serializedParent = null;

            if (currentDepth == 1)
            {
                serializedParent = new JObject
                {
                    ["id"] = new JObject()
                    {
                        ["value"] = (JToken)parent.ID.Guid.ToString(),
                    },
                    ["name"] = new JObject()
                    {
                        ["value"] = (JToken)parent.Name,
                    },
                    ["displayname"] = new JObject()
                    {
                        ["value"] = (JToken)parent.DisplayName,
                    },
                    ["props"] = ProcessItem(parent, rendering, renderingConfig)
                };
            }
            else
            {
                serializedParent = new JObject
                {
                    ["id"] = (JToken)parent.ID.Guid.ToString(),
                    ["name"] = (JToken)parent.Name,
                    ["displayname"] = (JToken)parent.DisplayName,
                    ["fields"] = ProcessItem(parent, rendering, renderingConfig)
                };
            }

            var childrenArray = new JArray();

            if (currentDepth <= MaxDepth)
            {
                var validChildren = parent.Children.Where(x => x.IsValid());
                foreach (var child in validChildren)
                {
                    var serializedChild = ProcessItemAndValidChildren(child, rendering, renderingConfig, currentDepth + 1);
                    childrenArray.Add(serializedChild);
                }
            }

            serializedParent["children"] = childrenArray;
            return serializedParent;
        }
    }
}