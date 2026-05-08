using System.ComponentModel.DataAnnotations;

using System.ComponentModel.DataAnnotations.Schema;
namespace GESTIONBUDGETAPI.Module
{
    [Table("etat")]
    public class Etat
    {
        [Key]
         public int etat_id { get; set; }
        public string? etat_name { get; set; }
    }
}