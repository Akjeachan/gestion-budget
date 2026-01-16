using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("bonprecommande")]
    public class BonPrecommande
    {
        [Key]
        public int bon_id { get; set; }
        public String? bon_arref { get; set; }
        public String? bon_dldesign { get; set; }
        public int? bon_dlqte { get; set; }
        public decimal? bon_dlprixunitaire { get; set; }
        public decimal? bon_dlmontantht { get; set; }
        public decimal? bon_dlmontantttc { get; set; }
        public DateTime bon_cbcreation { get; set; }
        public int? bon_etatid { get; set; }
        public String? bon_doref { get; set; }
    }
}
