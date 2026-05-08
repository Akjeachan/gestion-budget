using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("Numero_compte")]
    public class Numero_compte
    {
        [Key]
        public int numcompt_id { get; set; }
        public int numcompt_code { get; set; }
        public String? numcompt_intitule { get; set; }
        public int numcompt_classe { get; set; }
    }
}
