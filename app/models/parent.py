# from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer,Boolean
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func
# from app.config.database import Base
# from datetime import datetime

# class Parent(Base):
#     __tablename__ = "parents"

#     id = Column(String, primary_key=True, index=True)
#     user_id = Column(String, ForeignKey("users.id"), unique=True)
#     user = relationship("User", backref="parent_profile")

#     # Parent-specific fields
#     occupation = Column(String, nullable=True)  # e.g., "Engineer", "Teacher", "Business"
#     education_level = Column(String, nullable=True)  # e.g., "Bachelor's", "Master's", "Ph.D."
#     marital_status = Column(String, nullable=True)  # e.g., "Married", "Single", "Divorced"

#     # Emergency contact (additional contact info)
#     emergency_contact_name = Column(String, nullable=True)
#     emergency_contact_phone = Column(String, nullable=True)
#     emergency_contact_relation = Column(String, nullable=True)

#     # Family information
#     number_of_children = Column(Integer, nullable=True)

#     # Associated students (through user relationships)
#     # This will be handled through the User.parent_id relationship

#     is_active = Column(Boolean, default=True)
#     is_deleted = Column(Boolean, default=False)

#     # Timestamps
#     created_at = Column(DateTime, default=datetime.utcnow())
#     updated_at = Column(DateTime, onupdate=datetime.utcnow())
