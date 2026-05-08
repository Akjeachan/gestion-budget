using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public UserController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        [HttpPost]
        public ActionResult<User> Create([FromBody] User user)
        {
            _budgetContext.Users.Add(user);
            _budgetContext.SaveChanges();
            return Ok(user);
        }

        [HttpGet]
        public ActionResult<IEnumerable<User>> GetAll()
        {
            return _budgetContext.Users.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<User> GetById(int id)
        {
            var user = (from u in _budgetContext.Users
                        join d in _budgetContext.Departements on u.user_Departementid equals d.dept_id into deptJoin
                        from dj in deptJoin.DefaultIfEmpty()
                        where u.user_id == id
                        select new
                        {
                            u.user_id,
                            u.user_name,
                            u.user_identifiant,
                            u.user_type,
                            u.user_Departementid,
                            dept_name = dj != null ? dj.dept_name : null
                        }).FirstOrDefault();

            if (user == null)
            {
                return NotFound($"Utilisateur avec ID {id} introuvable.");
            }

            return Ok(user);
        }

        [HttpPut("{id:int}")]
        public ActionResult<User> Update(int id, [FromBody] User user)
        {
            var existingUser = _budgetContext.Users.Find(id);
            if (existingUser == null)
            {
                return NotFound($"Utilisateur avec ID {id} introuvable.");
            }

            existingUser.user_name = user.user_name;
            existingUser.user_identifiant = user.user_identifiant;
            existingUser.user_password = user.user_password;
            existingUser.user_type = user.user_type;
            existingUser.user_Departementid = user.user_Departementid;

            _budgetContext.SaveChanges();

            return Ok(existingUser);
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var types = _budgetContext.Types.Find(id);
            if (types == null)
            {
                return NotFound(new { Message = $"User with id{id}not found." });
            }
            _budgetContext.Types.Remove(types);
            _budgetContext.SaveChanges();
            return Ok(new { Message = $"User with ID {id} was successfully deleted." });
        }
    }
}
