using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("produit")]
    public class Produit
    {
        [Key]
        public int prod_id { get; set; }
        public string? prod_name { get; set; }
        public DateTime prod_dateajout { get; set; }
        public int? prod_createdby { get; set; }
        public int? prod_updateby { get; set; }
        public int? prod_numerocompteid { get; set; }
    }
}
