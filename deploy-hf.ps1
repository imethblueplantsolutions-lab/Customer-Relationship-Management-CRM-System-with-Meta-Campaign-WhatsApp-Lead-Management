param (
    [string]$Remote = "huggingface",
    [string]$Branch = "main"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying crm_imeth Backend to Hugging Face Spaces" -ForegroundColor Cyan
Write-Host "   Compute: 2 vCPU | 16GB RAM | Port: 7860" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if huggingface remote exists
$remotes = git remote
if (-not ($remotes -contains $Remote)) {
    Write-Host "⚠️  Remote '$Remote' not found." -ForegroundColor Yellow
    Write-Host "Please add your Hugging Face remote first:" -ForegroundColor Yellow
    Write-Host "   git remote add huggingface https://huggingface.co/spaces/YOUR_USERNAME/meta-crm-backend" -ForegroundColor White
    exit 1
}

Write-Host "📦 Extracting crm_imeth subtree and pushing to $Remote/$Branch..." -ForegroundColor Yellow
git subtree push --prefix crm_imeth $Remote $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to Hugging Face Spaces!" -ForegroundColor Green
    Write-Host "👉 Monitor your container build at: https://huggingface.co/spaces" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Subtree push encountered an error." -ForegroundColor Red
    Write-Host "If git subtree fails due to history mismatches, you can force push a temporary split branch:" -ForegroundColor Yellow
    Write-Host "   git subtree split --prefix crm_imeth -b hf-deploy" -ForegroundColor White
    Write-Host "   git push $Remote hf-deploy:main --force" -ForegroundColor White
    Write-Host "   git branch -D hf-deploy" -ForegroundColor White
}
