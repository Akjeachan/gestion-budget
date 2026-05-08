using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("produit")]
    public class Produit
    {
        [Key]
        public int prod_id { get; set; }
        public string? prod_articleref { get; set; }
        public string? prod_name { get; set; }
        public String? prod_rubriqueref { get; set; }
    }
}
