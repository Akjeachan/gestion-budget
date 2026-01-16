using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("produit")]
    public class ProduitCrmTest
    {
        [Key]
        public int prod_id { get; set; }
        public string? prod_name { get; set; }
    }
}
