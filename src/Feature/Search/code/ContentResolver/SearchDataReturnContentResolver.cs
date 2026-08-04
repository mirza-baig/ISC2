using ISC2.Feature.Search.Models;
using Newtonsoft.Json.Linq;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ISC2.Feature.Search.ContentResolver
{
    public class SearchDataReturnContentResolver : Sitecore.LayoutService.ItemRendering.ContentsResolvers.RenderingContentsResolver
    {
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var datasource = !string.IsNullOrEmpty(rendering.DataSource)
                ? rendering.RenderingItem?.Database.GetItem(rendering.DataSource)
                : null;

                if (datasource == null)
                {
                    return null;
                }

                ProcessItem(datasource, rendering, renderingConfig);
                var serializedItem = ProcessItem(datasource, rendering, renderingConfig);

                serializedItem["sortOptions"] = GetFilterKeyValue(datasource, datasource.Fields["sortOptionDetails"]?.Value, rendering, renderingConfig);
                serializedItem["facetKeyValues"] = GetKeyValueData(datasource, datasource.Fields["filterKeyValues"]?.Value, rendering, renderingConfig);
                serializedItem["defaultfiterKeyValues"] = GetFilterKeyValue(datasource, datasource.Fields["defaultFiltersForPage"]?.Value, rendering, renderingConfig);
                return serializedItem;
            }
            catch (Exception ex)
            {
                Sitecore.Diagnostics.Log.Error($"Error during DataSourceAndChildrenContentResolver: {ex.Message}", this);
                return new
                {
                    Item = ""
                };
            }
        }

        /// <summary>
        /// Returns filters details on search page.
        /// </summary>
        /// <param name="datasource"></param>
        /// <param name="keyValueData"></param>
        /// <param name="rendering"></param>
        /// <param name="renderingConfig"></param>
        /// <returns></returns>
        private JToken GetKeyValueData(Item datasource, string keyValueData, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var serializedItem = ProcessItem(datasource, rendering, renderingConfig);
            var keyValues = (keyValueData)?.Split('&')?.ToList();
            List<FacetsKeyValues> list = new List<FacetsKeyValues>();
            if (keyValues != null && keyValues.Count > 0)
            {
                foreach (var item in keyValues)
                {
                    var value = item.ToString()?.Split('=')?.LastOrDefault().Replace("%7B", "{").Replace("%7D", "}");
                    var keyValueItem = Sitecore.Context.Database.GetItem(value);
                    FacetsKeyValues data = new FacetsKeyValues
                    {
                        KeyName = item.ToString().Split('=').FirstOrDefault(),
                        FacetAttribute = keyValueItem?.Fields["attributeName"]?.Value,
                        FacetLabel = keyValueItem?.Fields["label"]?.Value,
                        FacetType = keyValueItem?.Fields["facetType"]?.Value,
                    };
                    list.Add(data);
                }
                return serializedItem["datatest"] = JToken.FromObject(list);

            }
            return "";
        }

        /// <summary>
        /// Get default filters
        /// </summary>
        /// <param name="datasource"></param>
        /// <param name="keyValueData"></param>
        /// <param name="rendering"></param>
        /// <param name="renderingConfig"></param>
        /// <returns></returns>
        private JToken GetFilterKeyValue(Item datasource, string keyValueData, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var serializedItem = ProcessItem(datasource, rendering, renderingConfig);
            var keyValues = (keyValueData)?.Split('&')?.ToList();
            List<DefaultFilterFieldValues> list = new List<DefaultFilterFieldValues>();
            if (keyValues != null && keyValues.Count > 0)
            {
                foreach (var item in keyValues)
                {
                    DefaultFilterFieldValues data = new DefaultFilterFieldValues
                    {
                        FilterKey = item.ToString()?.Split('=')?.FirstOrDefault().Trim(),
                        FilterValue = item.ToString()?.Split('=')?.LastOrDefault().Replace("%2C", ",").Replace("%20", " ").Trim()
                    };
                    list.Add(data);
                }
                return serializedItem["datatest"] = JToken.FromObject(list);

            }
            return "";
        }
    }
}