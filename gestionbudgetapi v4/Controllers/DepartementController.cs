using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartementController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public DepartementController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        [HttpPost]
        public ActionResult<Departement> Create([FromBody] Departement departement)
        {
            _budgetContext.Departements.Add(departement);
            _budgetContext.SaveChanges();
            return Ok(departement);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Departement>> GetAll()
        {
            return _budgetContext.Departements.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Departement> GetById(int id)
        {
            var departement = _budgetContext.Departements.Find(id);
            return Ok(departement);
        }

        [HttpPut("{id:int}")]
        public ActionResult<Departement> Update(int id, [FromBody] Departement departement)
        {
            var existingdepartement = _budgetContext.Departements.Find(id);
            if (existingdepartement == null)
            {
                return NotFound($"Departement avec ID {id} introuvable.");
            }

            existingdepartement.dept_name = departement.dept_name;
            _budgetContext.SaveChanges();

            return Ok(existingdepartement);
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var departement = _budgetContext.Departements.Find(id);
            if (departement == null)
            {
                return NotFound(new { Message = $"Departement with id{id}not found." });
            }
            _budgetContext.Departements.Remove(departement);
            _budgetContext.SaveChanges();
            return Ok(new { Message = $"Departement with ID {id} was successfully deleted." });
        }
    }
}
