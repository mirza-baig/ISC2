namespace ISC2.Feature.Search.Models
{
    public class FacetsKeyValues
    {
        public string KeyName { get; set; }
        public string FacetAttribute { get; set; }
        public string FacetLabel { get; set; }
        public string FacetType { get; set; }
    }

    public class DefaultFilterFieldValues
    { 
        public string FilterKey { get; set;}
        public string FilterValue { get; set; }
    }
}