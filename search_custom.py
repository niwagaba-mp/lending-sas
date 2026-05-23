import os

def search_files(directory, query):
    results = []
    for root, dirs, files in os.walk(directory):
        # Modify dirs in-place to prune directories we don't want to walk
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', '.git', 'tmp', 'build')]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.sql')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        for i, line in enumerate(f, 1):
                            if query.lower() in line.lower():
                                results.append((filepath, i, line.strip()))
                except Exception:
                    pass
    return results

queries = ["cleared", "GenericTransactionModal", "DEMO_STAFF", "ExportPage", "export_data"]
for q in queries:
    print(f"\n--- Search for: {q} ---")
    res = search_files('smos', q)
    for path, line_no, line in res[:50]:
        print(f"{path}:{line_no}: {line}")
