using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace GESTIONBUDGETAPI.Module
{
        [Table("etat_realisation")] 
    public class Etat_Realisation
    {
        [Key]
        public int etatr_id { get; set; }
        public string? etatr_name { get; set; }
    }
}