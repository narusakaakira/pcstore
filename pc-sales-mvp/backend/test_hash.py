from app.auth.password import hash_password, verify_password

# Test 1: Generate fresh hash
fresh_hash = hash_password('admin123')
print(f"Fresh hash: {fresh_hash}")

# Test 2: Verify fresh hash
result = verify_password('admin123', fresh_hash)
print(f"Fresh hash verification: {result}")

# Test 3: Try DB hash from seed
db_hash = "$2b$12$5wm0a///LOuIcXs5lpKfWOyFDiRRGWIj3o8ulmSoSr9e2ZXJnIS2K"
try:
    result = verify_password('admin123', db_hash)
    print(f"DB hash verification: {result}")
except Exception as e:
    print(f"DB hash verification error: {type(e).__name__}: {e}")
