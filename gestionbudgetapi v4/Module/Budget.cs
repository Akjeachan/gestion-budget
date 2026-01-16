using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("budget")]
    public class Budget
    {
        [Key]
        public int budget_id { get; set; }
        public String? budget_code { get; set; }
        public int budget_plannificationid { get; set; }
        public decimal? budget_montant { get; set; }
        public DateTime budget_datecreation { get; set; }
    }
}
