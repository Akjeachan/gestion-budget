using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("V_BonPrecommande")] // ✅ Nom exact de la vue dans SQL Server
    public class V_BonPrecommandeSage
    {
        [Key]
        public int cbMarq { get; set; }
        public String? AR_Ref { get; set; }
        public String? DL_Design { get; set; }
        public decimal DL_Qte { get; set; }
        public decimal DL_PrixUnitaire { get; set; }
        public decimal DL_MontantHT { get; set; }
        public decimal DL_MontantTTC { get; set; }
        public DateTime cbCreation { get; set; }
        public String? DO_Ref { get; set; }
    }
}
