import uuid

def generate_id(name: str) -> str:
    # Take first 3 letters of name (remove spaces, lowercase)
    prefix = name.replace(" ", "").lower()[:3]
    # Generate a numeric 5-digit string from UUID
    numeric_part = str(uuid.uuid4().int)[:8]

    return prefix + numeric_part


def generate_otp() -> str:
    return str(uuid.uuid4().int)[:6]

def generate_doc_id() -> str:
    return str(uuid.uuid4().int)[:8]

def generate_large_id() -> str:
    prefix = str(uuid.uuid4().int)[:6]
    postfix = str(uuid.uuid4()[:10])
    return prefix + postfix

def generate_prod_large_id(admin_id:str) -> str:
    postfix = str(uuid.uuid4()[:10])
    return admin_id + postfix

