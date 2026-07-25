from flask import jsonify

def success_response(data=None, message=None, status=200):
    """Standard success response format"""
    response = {
        "success": True,
        "data": data
    }
    if message:
        response["message"] = message
    return jsonify(response), status

def error_response(message="An error occurred", status=400):
    """Standard error response format"""
    return jsonify({
        "success": False,
        "error": message
    }), status
