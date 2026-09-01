import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

# I will find the exact extra `})}      </div>    </section>  );}` and remove them.
# The `Board` function ends at `  ); \n}` and then it shouldn't have another `})}</div></section>);}`.
bad_str = """  );
})}
      </div>
    </section>
  );
}"""
content = content.replace(bad_str, "  );\n}")

with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)
