using GESTIONBUDGETAPI.Data;
using GESTIONBUDGETAPI.Module;
using Microsoft.AspNetCore.Mvc;

namespace GESTIONBUDGETAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BudgetController : ControllerBase
    {
        private readonly BudgetContext _budgetContext;

        public BudgetController(BudgetContext BudgetContext)
        {
            _budgetContext = BudgetContext;
        }

        [HttpPost]
        public ActionResult<Budget> Create([FromBody] Budget budget)
        {
            _budgetContext.Budgets.Add(budget);
            _budgetContext.SaveChanges();
            return Ok(budget);
        }

        [HttpGet]
        public ActionResult<IEnumerable<Budget>> GetAll()
        {
            return _budgetContext.Budgets.ToList();
        }

        [HttpGet("{id:int}")]
        public ActionResult<Budget> GetById(int id)
        {
            var budget = _budgetContext.Budgets.Find(id);
            return Ok(budget);
        }

        [HttpPut("{id:int}")]
        public ActionResult<Budget> Update(int id, [FromBody] Budget budget)
        {
            var existingBudget = _budgetContext.Budgets.Find(id);
            if (existingBudget == null)
            {
                return NotFound($"Budget avec ID {id} introuvable.");
            }

            existingBudget.budget_montant = budget.budget_montant;
            _budgetContext.SaveChanges();

            return Ok(existingBudget);
        }

        [HttpDelete("{id:int}")]
        public ActionResult DeleteById(int id)
        {
            var budget = _budgetContext.Budgets.Find(id);
            if (budget == null)
            {
                return NotFound(new { Message = $"Budget with id{id}not found." });
            }
            _budgetContext.Budgets.Remove(budget);
            _budgetContext.SaveChanges();
            return Ok(new { Message = $"Budget with ID {id} was successfully deleted." });
        }
    }
}
