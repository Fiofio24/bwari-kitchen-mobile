# Nigeria Electricity Projection Calculator

# Given values from the problem
current_generated = 5801      # Current MW
projected_mw = 33000          # Target MW for 24hrs light
avg_increase_per_year = 11.87 # Average MW added per year

# Calculate the number of years needed
years_needed = (projected_mw - current_generated) / avg_increase_per_year

# Display the result clearly
print("Nigeria's Electricity Projection")
print(f"Current generation: {current_generated} MW")
print(f"Projected target: {projected_mw} MW")
print(f"Average annual increase: {avg_increase_per_year} MW/year")
print(f"\nIt will take approximately {years_needed:.2f} years to reach 33,000 MW.")
print("This is when we can hope for 24 hours of electricity (based on the given assumptions).")