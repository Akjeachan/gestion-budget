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
            var user = _budgetContext.Users.Find(id);
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
