#!/usr/bin/env python3
"""
Generate a static basketball court image using mplbasketball and save it to the static folder.
Run this script once to create the court image, then update the HTML to use the static file.
"""

import os
import sys
from mplbasketball import Court
import matplotlib.pyplot as plt

# Set the backend to avoid display issues
plt.switch_backend('Agg')

def generate_court_image(court_type="nba"):
    """Generate and save a basketball court image for the specified court type"""
    
    # Create court with bottom-left origin and meters as units
    court = Court(court_type=court_type, origin="bottom-left", units="m")
    
    # Create figure with high resolution and proper parameters
    fig, ax = court.draw(
        dpi=300,             # High DPI for crisp lines
        pad=0,             # Small padding to ensure court is fully visible
        line_width=0.2,      # Much thinner lines for cleaner look
        line_color='white',  # White lines on burlywood background
        court_color='burlywood',  # Court background color
        paint_color='burlywood'   # Paint area color
    )
    
    # Set a larger figure size to make lines appear thinner
    fig.set_size_inches(18.8, 10.0)  # Double the size for thinner-looking lines
    
    # Remove axes for clean court image
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_xlabel('')
    ax.set_ylabel('')
    
    # Set background color to match the original burlywood
    fig.patch.set_facecolor('burlywood')
    ax.set_facecolor('burlywood')
    
    # Ensure the static directory exists
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'basketball', 'static'))
    os.makedirs(static_dir, exist_ok=True)
    
    # Save the image with matching DPI
    output_path = os.path.join(static_dir, f'court-{court_type}.png')
    fig.savefig(output_path, format="png", bbox_inches='tight', 
                facecolor='burlywood', edgecolor='none', dpi=300)
    plt.close(fig)
    
    print(f"{court_type.upper()} court image generated successfully: {output_path}")
    print(f"Image dimensions: 5640x3000 pixels (94:50 aspect ratio at 300 DPI)")
    print(f"Background color: burlywood")
    print(f"Parameters: DPI=300, line_width=0.2, pad=2.0, figsize=18.8x10.0")
    
    return output_path

def generate_all_court_images():
    """Generate all 4 court types: NBA, WNBA, NCAA, and FIBA"""
    court_types = ["nba", "wnba", "ncaa", "fiba"]
    generated_files = []
    
    for court_type in court_types:
        try:
            output_path = generate_court_image(court_type)
            generated_files.append(output_path)
        except Exception as e:
            print(f"Error generating {court_type.upper()} court: {e}")
    
    return generated_files

if __name__ == "__main__":
    try:
        generated_files = generate_all_court_images()
        print(f"\nSuccess! Generated {len(generated_files)} court images:")
        for file_path in generated_files:
            print(f"   - {file_path}")
    except ImportError as e:
        print(f"Error: {e}")
        print("Make sure to install mplbasketball first: pip install mplbasketball")
        sys.exit(1)
    except Exception as e:
        print(f"Error generating court images: {e}")
        sys.exit(1)
