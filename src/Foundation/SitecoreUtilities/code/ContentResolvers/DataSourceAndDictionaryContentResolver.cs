using Newtonsoft.Json.Linq;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using System;
using System.Linq;
using System.Web;

namespace ISC2.Foundation.SitecoreUtilities.ContentResolvers
{
    public class DataSourceAndDictionaryContentResolver : Sitecore.LayoutService.ItemRendering.ContentsResolvers.RenderingContentsResolver
    {
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var contentsToReturn = this.ProcessItem(rendering.Item, rendering, renderingConfig);

                Item datasourceItem = this.GetContextItem(rendering, renderingConfig);

                foreach
                (
                    var templateField
                    in
                    datasourceItem.Template.Fields.Where
                    (
                        field => field.Type == "Droptree"
                        &&
                        !field.InnerItem.Paths.FullPath.StartsWith("/sitecore/templates/system", StringComparison.OrdinalIgnoreCase)
                    )
                )
                {
                    var dictionaryItem = ((LookupField)datasourceItem.Fields[templateField.Name]).TargetItem;

                    if(dictionaryItem?.TemplateID.Equals(Templates.Dictionary.DictionaryFolderTemplateId) ?? false)
                    {
                        var dictionaryEntriesToReturn = string.Empty;

                        if(dictionaryItem.HasChildren)
                        {
                            var dictionaryEntries
                                =
                                dictionaryItem?.Children
                                    .Where(entry => entry?.TemplateID.Equals(Templates.Dictionary.DictionaryEntryTemplateId) ?? false)
                                    .Select
                                    (
                                        entry
                                        =>
                                        {
                                            return
                                                string.IsNullOrEmpty(entry?.Fields["Key"]?.Value)
                                                ?
                                                null
                                                :
                                                entry.Fields["Key"].Value + "=" + HttpUtility.UrlPathEncode(entry.Fields["Phrase"].Value);
                                        }
                                    )
                                    .ToArray();

                            dictionaryEntriesToReturn = dictionaryEntries?.Any() ?? false ? string.Join("&", dictionaryEntries) : string.Empty;
                        }

                        contentsToReturn[templateField.Name] = new JObject { ["value"] = dictionaryEntriesToReturn };
                    }
                }

                return contentsToReturn;
            }
            catch (Exception ex)
            {
                Sitecore.Diagnostics.Log.Error($"Error during DataSourceAndDictionaryContentResolver: {ex.Message}", this);
                
                // Returns unprocessed content.
                return this.ProcessItem(rendering.Item, rendering, renderingConfig);
            }
        }
    }
}