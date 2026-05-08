using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("ecart_budget")]
    public class EcartBudget
    {
        [Key]
        public int ecart_id { get; set; }
        public decimal ecart_prixunitaire { get; set; }
        public decimal ecart_montanttotal { get; set; }
    }
}
