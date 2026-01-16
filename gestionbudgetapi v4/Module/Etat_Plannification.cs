using System.ComponentModel.DataAnnotations;

using System.ComponentModel.DataAnnotations.Schema;
namespace GESTIONBUDGETAPI.Module
{
    [Table("etat_plannification")]
    public class Etat_Plannification
    {
        [Key]
         public int etatp_id { get; set; }
        public string? etatp_name { get; set; }
    }
}