using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GESTIONBUDGETAPI.Module
{
    [Table("users")]
    public class User
    {
        [Key]
        public int user_id { get; set; }
        public string? user_name { get; set; }
        public string? user_identifiant { get; set; }
        public string? user_password { get; set; }
        public int user_type { get; set; }
        public int user_Departementid { get; set; }

     
    }

}
