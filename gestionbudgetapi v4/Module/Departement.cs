using System.ComponentModel.DataAnnotations;

using System.ComponentModel.DataAnnotations.Schema;
namespace GESTIONBUDGETAPI.Module
{
[Table("Departement")]
    public class Departement
    {
        [Key]
        public int dept_id { get; set; }
        public String? dept_name { get; set; }
    }
}