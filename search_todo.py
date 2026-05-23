import os

def search_files(directory, query):
    results = []
    for root, dirs, files in os.walk(directory):
        # Modify dirs in-place to prune directories we don't want to walk
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', '.git', 'tmp', 'build')]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.html')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        for i, line in enumerate(f, 1):
                            if query.lower() in line.lower():
                                results.append(f"{filepath}:{i}: {line.strip()}")
                except Exception:
                    pass
    return results

print("\n--- TODO SEARCH RESULTS ---")
for r in search_files('smos', 'TODO'):
    print(r)

print("\n--- FIXME SEARCH RESULTS ---")
for r in search_files('smos', 'FIXME'):
    print(r)
