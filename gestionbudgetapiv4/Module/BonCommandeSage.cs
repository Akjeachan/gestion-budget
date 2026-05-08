using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

[Keyless]
[Table("v_boncommande_sage")]
public class BonCommandeSage
{
    public int cbMarq { get; set; }
    public string? AR_Ref { get; set; }
    public string? DL_Design { get; set; }
    public decimal DL_Qte { get; set; }
    public decimal DL_PrixUnitaire { get; set; }
    public decimal DL_MontantHT { get; set; }
    public decimal DL_MontantTTC { get; set; }
    public DateTime? doc_cbCreation { get; set; }
    public string? doc_DO_Ref { get; set; }
    public short DO_Type { get; set; }
}
